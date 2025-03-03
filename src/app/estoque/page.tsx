"use client";

import { JSX, useEffect, useState } from "react";
import {
  buscarProdutosEstoqueBaixo,
  buscarProdutosProximosVencimento,
} from "@/lib/estoqueServices";
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
} from "antd";
import { AlertTriangle, XCircle, Clock } from "lucide-react";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Produto {
  id: string;
  nome_produto: string;
  codigo_barras: string;
  tipo_produto: string;
  categoria: string;
  unidade_medida: string;
  fabricante?: string;
  fornecedor?: string;
  numero_lote?: string;
  descricao?: string;
  data_fabricacao?: string;
  data_validade?: string;
  quantidade_recebida: number;
  numero_nota_fiscal?: string;
  quantidade_minima_estoque: number;
  data_entrada: string;
  responsavel: string;
}

export default function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosVencendo, setProdutosVencendo] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Estados para os filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);
  const [validadeFiltro, setValidadeFiltro] = useState<[string, string] | null>(
    null
  );
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
        [
          "Código",
          "Nome",
          "Categoria",
          "Quantidade",
          "Estoque Mínimo",
          "Data de Validade",
          "Status",
        ],
      ],
      body: produtosFiltrados.map((produto) => [
        produto.codigo_barras,
        produto.nome_produto,
        produto.categoria,
        produto.quantidade_recebida,
        produto.quantidade_minima_estoque,
        produto.data_validade
          ? dayjs(produto.data_validade).format("DD/MM/YYYY")
          : "-",
        getStatusTexto(
          produto.quantidade_recebida,
          produto.quantidade_minima_estoque,
          produto.data_validade as string
        ),
      ]),
      theme: "grid",
    });

    doc.save("Relatorio_Estoque.pdf");
  };
  useEffect(() => {
    async function fetchProdutos() {
      const produtosBaixo = await buscarProdutosEstoqueBaixo();
      const produtosVenc = await buscarProdutosProximosVencimento();

      setProdutos(produtosBaixo);
      setProdutosVencendo(produtosVenc);
      setLoading(false);
    }
    fetchProdutos();
  }, []);

  const getStatusTexto = (quantidade: number, minimo: number, validade?: string): string => {
    const hoje = dayjs();
    const diasParaVencer = validade ? dayjs(validade).diff(hoje, "day") : null;
    const status: string[] = [];
  
    if (quantidade === 0) status.push("Em Falta");
    if (quantidade > 0 && quantidade <= minimo) status.push("Estoque Baixo");
    if (diasParaVencer !== null) {
      if (diasParaVencer < 0) status.push("Vencido");
      else if (diasParaVencer <= 30) status.push("Próx. do Vencimento");
    }
  
    return status.length > 0 ? status.join(", ") : "Ok";
  };
  
  // 🔹 Função para definir status
  const getStatus = (quantidade: number, minimo: number, validade: string) => {
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

    return statusTags.length > 0 ? statusTags : <Tag color="green">Ok</Tag>;
  };

  // 🔹 Aplicar os filtros nos produtos
  const produtosFiltrados = [...produtos, ...produtosVencendo].filter(
    (produto) => {
      if (categoriaFiltro && produto.categoria !== categoriaFiltro)
        return false;
      if (validadeFiltro) {
        const validadeProduto = dayjs(produto.data_validade);
        if (
          validadeProduto.isBefore(dayjs(validadeFiltro[0])) ||
          validadeProduto.isAfter(dayjs(validadeFiltro[1]))
        ) {
          return false;
        }
      }

      if (statusFiltro) {
        const status = getStatus(
          produto.quantidade_recebida,
          produto.quantidade_minima_estoque,
          produto.data_validade
            ? dayjs(produto.data_validade).format("DD/MM/YYYY")
            : "-"
        );
        const statusText = (Array.isArray(status) ? status : [status])
          .map((tag) => {
            if (typeof tag === "object" && "props" in tag) {
              return tag.props.children[1] as string;
            }
            return "";
          })
          .filter((text) => text);

        if (!statusText.includes(statusFiltro)) return false;
      }

      return true;
    }
  );

  return (
    <>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}
      >
        <Select
          placeholder="Filtrar por Categoria"
          allowClear
          style={{ width: 200, minWidth: 160 }}
          onChange={(value) => setCategoriaFiltro(value)}
        >
          <Option value="analgesicos">Analgésicos</Option>
          <Option value="antibioticos">Antibióticos</Option>
          <Option value="equipamentos_medicos">Equipamentos Médicos</Option>
          <Option value="material_consumo">Material de Consumo</Option>
        </Select>

        <Select
          placeholder="Filtrar por Status"
          allowClear
          style={{ width: 200, minWidth: 160 }}
          onChange={(value) => setStatusFiltro(value)}
        >
          <Option value="Em Falta">Em Falta</Option>
          <Option value="Estoque Baixo">Estoque Baixo</Option>
          <Option value="Próx. do Vencimento">Próx. do Vencimento</Option>
          <Option value="Vencido">Vencido</Option>
        </Select>

        <RangePicker
          placeholder={["Data Inicial", "Data Final"]}
          format="DD/MM/YYYY"
          onChange={(dates) =>
            setValidadeFiltro(
              dates && dates[0] && dates[1]
                ? [dates[0].format(), dates[1].format()]
                : null
            )
          }
        />

        <Button
          type="primary"
          onClick={() => {
            setCategoriaFiltro(null);
            setStatusFiltro(null);
            setValidadeFiltro(null);
          }}
        >
          Limpar Filtros
        </Button>
      </div>
      <Card style={{ padding: 24 }}>
        <Title level={2}>Estoque de Produtos</Title>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 16,
          }}
        >
          <Button type="primary" onClick={gerarPDF}>
            Gerar Relatório PDF
          </Button>
        </div>
        <Divider />
        {loading ? (
          <Spin size="large" />
        ) : (
          <Table
            dataSource={produtosFiltrados}
            scroll={{ x: "max-content" }} // 🔹 Responsivo com rolagem horizontal
            columns={[
              {
                title: "Código",
                dataIndex: "codigo_barras",
                key: "codigo",
                responsive: ["xs", "sm", "md", "lg", "xl"],
              },
              {
                title: "Nome",
                dataIndex: "nome_produto",
                key: "nome",
                ellipsis: true,
                responsive: ["xs", "sm", "md", "lg", "xl"],
              },
              {
                title: "Categoria",
                dataIndex: "categoria",
                key: "categoria",
                responsive: ["sm", "md", "lg", "xl"],
              },
              {
                title: "Quantidade",
                dataIndex: "quantidade_recebida",
                key: "quantidade",
                responsive: ["xs", "sm", "md", "lg", "xl"],
              },
              {
                title: "Estoque Mínimo",
                dataIndex: "quantidade_minima_estoque",
                key: "limite",
                responsive: ["md", "lg", "xl"],
              },
              {
                title: "Data de Validade",
                dataIndex: "data_validade",
                key: "validade",
                render: (data_validade: string) =>
                  data_validade
                    ? dayjs(data_validade).format("DD/MM/YYYY")
                    : "-",
                responsive: ["md", "lg", "xl"],
              },
              {
                title: "Status",
                key: "status",
                render: (_, record) =>
                  getStatus(
                    record.quantidade_recebida,
                    record.quantidade_minima_estoque,
                    record.data_validade
                      ? dayjs(record.data_validade).format("DD/MM/YYYY")
                      : "-"
                  ),
                responsive: ["xs", "sm", "md", "lg", "xl"],
              },
            ]}
            rowKey="id"
          />
        )}
      </Card>
    </>
  );
}
