"use client";

import { JSX, useEffect, useState } from "react";
import { buscarProdutosEstoque  } from "@/lib/estoqueServices"; // Ajustado para buscar estoque real
import {
  Table,
  Spin,
  Typography,
  Tag,
  Select,
  DatePicker,
  Button,
  Card,
  Divider,
  Col,
  Row,
} from "antd";
import { AlertTriangle, XCircle, Clock, RefreshCcw, FileText } from "lucide-react";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Produto {
  id: string;
  nome_produto: string;
  codigo_barras: string;
  tipo_produto: string;
  categoria: string;
  unidade_medida: string;
  quantidade: number; // Ajustado para refletir a quantidade real
  quantidade_minima_estoque: number;
  data_validade?: string;
}

export default function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Estados para os filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);
  const [validadeFiltro, setValidadeFiltro] = useState<[string, string] | null>(
    null
  );
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    async function fetchProdutos() {
      const produtosEstoque = await buscarProdutosEstoque();
      setProdutos(produtosEstoque);
      setLoading(false);
    }
    fetchProdutos();
  }, []);

  const gerarPDF = () => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RELATÓRIO DE ESTOQUE DE PRODUTOS", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(
      `Data de Geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      14,
      25
    );

    autoTable(doc, {
      startY: 35,
      head: [
        ["Código", "Nome", "Categoria", "Qtd Estoque", "Estoque Mínimo", "Data de Validade", "Status"],
      ],
      body: produtosFiltrados.map((produto) => [
        produto.codigo_barras,
        produto.nome_produto,
        produto.categoria,
        produto.quantidade, // 🔹 Quantidade real do estoque
        produto.quantidade_minima_estoque,
        produto.data_validade ? dayjs(produto.data_validade).format("DD/MM/YYYY") : "-",
        getStatusTexto(produto.quantidade, produto.quantidade_minima_estoque, produto.data_validade),
      ]),
      theme: "grid",
    });

    doc.save("Relatorio_Estoque.pdf");
  };

  const getStatusTexto = (quantidade: number, minimo: number, validade?: string): string[] => {
    const hoje = dayjs();
    const diasParaVencer = validade ? dayjs(validade).diff(hoje, "day") : null;
    const status: string[] = [];

    if (quantidade === 0) status.push("Em Falta");
    if (quantidade > 0 && quantidade <= minimo) status.push("Estoque Baixo");
    if (diasParaVencer !== null) {
      if (diasParaVencer < 0) status.push("Vencido");
      else if (diasParaVencer <= 30) status.push("Próx. do Vencimento");
    }

    return status.length > 0 ? status : ["Ok"];
  };

  const getStatus = (quantidade: number, minimo: number, validade?: string) => {
    const hoje = dayjs();
    const diasParaVencer = validade ? dayjs(validade).diff(hoje, "day") : null;
    const statusTags: JSX.Element[] = [];

    if (quantidade === 0) {
      statusTags.push(
        <Tag color="red" key="falta">
          <XCircle size={16} style={{ marginRight: 4 }} />
          Em Falta
        </Tag>
      );
    }

    if (quantidade > 0 && quantidade <= minimo) {
      statusTags.push(
        <Tag color="orange" key="baixo">
          <AlertTriangle size={16} style={{ marginRight: 4 }} />
          Estoque Baixo
        </Tag>
      );
    }

    if (diasParaVencer !== null) {
      if (diasParaVencer < 0) {
        statusTags.push(
          <Tag color="volcano" key="vencido">
            <XCircle size={16} style={{ marginRight: 4 }} />
            Vencido
          </Tag>
        );
      } else if (diasParaVencer <= 30) {
        statusTags.push(
          <Tag color="gold" key="prox_venc">
            <Clock size={16} style={{ marginRight: 4 }} />
            Próx. do Vencimento
          </Tag>
        );
      }
    }

    if (statusTags.length === 0) {
      statusTags.push(
        <Tag color="green" key="ok">
          Ok
        </Tag>
      );
    }

    return statusTags;
  };

  const produtosFiltrados = produtos.filter((produto) => {
    if (categoriaFiltro && produto.categoria !== categoriaFiltro) return false;
    if (validadeFiltro) {
      const validadeProduto = dayjs(produto.data_validade);
      if (validadeProduto.isBefore(dayjs(validadeFiltro[0])) || validadeProduto.isAfter(dayjs(validadeFiltro[1]))) {
        return false;
      }
    }
    if (statusFiltro) {
      const statusProduto = getStatusTexto(produto.quantidade, produto.quantidade_minima_estoque, produto.data_validade);
      if (!statusProduto.some((status) => status === statusFiltro)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Estoque de Produtos</Title>
      <Card style={{ padding: 24 }}>
        <Row justify="space-between">
          <Col>
            <span>Itens por página: </span>
            <Select value={pageSize} onChange={(value) => setPageSize(value)} style={{ width: 80, marginLeft: 8 }}>
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
            </Select>
          </Col>
          <Col>
            <Button type="primary" icon={<FileText size={16} />} onClick={gerarPDF}>
              Gerar Relatório
            </Button>
          </Col>
        </Row>
        <Divider />
        {loading ? <Spin size="large" /> : (
          <Table dataSource={produtosFiltrados} pagination={{ pageSize }} rowKey="id"
            columns={[
              { title: "Código", dataIndex: "codigo_barras", key: "codigo" },
              { title: "Nome", dataIndex: "nome_produto", key: "nome" },
              { title: "Quantidade Estoque", dataIndex: "quantidade", key: "quantidade" },
              { title: "Estoque Mínimo", dataIndex: "quantidade_minima_estoque", key: "estoque_minimo" },
              { title: "Status", key: "status", render: (_, record) => getStatus(record.quantidade, record.quantidade_minima_estoque, record.data_validade) },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
