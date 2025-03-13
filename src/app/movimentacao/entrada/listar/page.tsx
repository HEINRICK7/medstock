"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  Input,
  Select,
  Button,
  DatePicker,
  message,
  Card,
  Row,
  Col,
  Popconfirm,
} from "antd";
import { Eye, Edit, Trash2, RefreshCcw, FileText } from "lucide-react";
import debounce from "lodash.debounce";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useRouter } from "next/navigation";
import Title from "antd/es/typography/Title";

dayjs.locale("pt-br");

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Produto {
  id: string;
  nome_produto: string;
  codigo_barras: string;
  categoria: string;
  quantidade: number;
  data_entrada: string;
  origem: string;
  fabricante: string;
  fornecedor: string;
  numero_lote: string;
}

export default function ListarProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    nome: "",
    categoria: "",
    dataEntrada: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });
  const [pageSize, setPageSize] = useState(5);
  const router = useRouter();

  useEffect(() => {
    fetchEntradas();
  }, []);

  const fetchEntradas = async (updatedFilters = filters) => {
    setLoading(true);
    let query = supabase
      .from("movimentacoes_estoque")
      .select("*")
      .eq("tipo_movimentacao", "entrada")
      .order("data_movimentacao", { ascending: false });
  
    if (updatedFilters.nome.length >= 3) {
      query = query.ilike("nome_produto", `%${updatedFilters.nome}%`);
    }
  
    if (updatedFilters.categoria) {
      query = query.eq("categoria", updatedFilters.categoria);
    }
  
    if (updatedFilters.dataEntrada) {
      const [start, end] = updatedFilters.dataEntrada;
      query = query.gte("data_entrada", start.format("YYYY-MM-DD"));
      query = query.lte("data_entrada", end.format("YYYY-MM-DD"));
    }
  
    const { data, error } = await query;
    if (error) {
      message.error("Erro ao buscar entradas: " + error.message);
    } else {
      setProdutos(data || []);
    }
    setLoading(false);
  };
  

  const debouncedfetchEntradas = debounce(fetchEntradas, 500);

  const handleLimparFiltros = () => {
    const resetFilters = { nome: "", categoria: "", dataEntrada: null };
    setFilters(resetFilters);
    fetchEntradas(resetFilters);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) {
      message.error("Erro ao deletar o produto: " + error.message);
    } else {
      message.success("Produto deletado com sucesso!");
      fetchEntradas(); // Atualiza a lista após a exclusão
    }
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RELATÓRIO DE PRODUTOS", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Data de Geração: ${dayjs().format("DD/MM/YYYY")}`, 14, 25);

    produtos.forEach((p, index) => {
      // Adiciona uma seção de informações de origem para cada produto
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 150);
      doc.text(`2. Informações de Origem - Produto ${index + 1}`, 14, 35);
      autoTable(doc, {
        startY: 30,
        head: [["Campo", "Valor"]],
        body: produtos.map((p) => [
          ["Fabricante", p.fabricante || "Não informado"],
          ["Fornecedor", p.fornecedor || "Não informado"],
          ["Número do Lote", p.numero_lote || "N/A"],
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
      });

      // Adiciona a tabela principal de produtos
      autoTable(doc, {
        startY: 30,
        head: [
          [
            "Código",
            "Nome",
            "Categoria",
            "Quantidade",
            "Data de Entrada",
            "Origem",
          ],
        ],
        body: produtos.map((p) => [
          p.codigo_barras,
          p.nome_produto,
          p.categoria.replace(/_/g, " "),
          p.quantidade,
          dayjs(p.data_entrada).format("DD/MM/YYYY"),
          p.fabricante || "Não informado",
        ]),
        theme: "grid",
      });
    });

    doc.save(`Relatorio_Produtos.pdf`);
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Listar Produtos</Title>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Input
              placeholder="Nome do Produto"
              value={filters.nome}
              onChange={(e) => {
                const nome = e.target.value;
                setFilters((prev) => ({ ...prev, nome }));

                if (nome.length === 0) {
                  fetchEntradas();
                } else if (nome.length >= 3) {
                  debouncedfetchEntradas();
                }
              }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Categoria"
              value={filters.categoria}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, categoria: value }));
                fetchEntradas({ ...filters, categoria: value });
              }}
              style={{ width: "100%" }}
            >
              <Option value="">Todas</Option>
              <Option value="analgesicos">Analgésicos</Option>
              <Option value="equipamentos_medicos">Equipamentos Médicos</Option>
              <Option value="material_consumo">Material de Consumo</Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <RangePicker
              placeholder={["Data Inicial", "Data Final"]}
              format="DD/MM/YYYY"
              onChange={(dates) => {
                setFilters((prev) => ({
                  ...prev,
                  dataEntrada: dates as [dayjs.Dayjs, dayjs.Dayjs],
                }));
                fetchEntradas({
                  ...filters,
                  dataEntrada: dates as [dayjs.Dayjs, dayjs.Dayjs],
                });
              }}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} md={4}>
            <Button
              icon={<RefreshCcw size={16} />}
              onClick={handleLimparFiltros}
              style={{ width: "100%" }}
            >
              Limpar
            </Button>
          </Col>
        </Row>
      </div>

      <Card style={{ padding: 24 }}>
        <Row
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Col>
            <span>Itens por página: </span>
            <Select
              value={pageSize}
              onChange={(value) => setPageSize(value)}
              style={{ width: 80, marginLeft: 8 }}
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={20}>20</Option>
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<FileText size={16} />}
              onClick={gerarPDF}
            >
              Gerar Relatório
            </Button>
          </Col>
        </Row>

        <Table
          dataSource={produtos}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize }}
          scroll={{ x: 800 }}
          locale={{ emptyText: "Nenhum produto encontrado" }}
          columns={[
            {
              title: "Código",
              dataIndex: "codigo_barras",
              key: "codigo_barras",
            },
            {
              title: "Nome",
              dataIndex: "nome_produto",
              key: "nome_produto",
            },
            {
              title: "Categoria",
              dataIndex: "categoria",
              key: "categoria",
            },
            {
              title: "Quantidade",
              dataIndex: "quantidade",
              key: "quantidade",
            },
            {
              title: "Data de Entrada",
              dataIndex: "data_entrada",
              key: "data_entrada",
              render: (text) => dayjs(text).format("DD/MM/YYYY"),
            },
            {
              title: "Ações",
              key: "acoes",
              render: (text, record) => (
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    type="default"
                    icon={<Eye size={16} />}
                    onClick={() =>
                      router.push(`/movimentacao/entrada/visualizar/${record.id}`)
                    }
                  />
                  <Button
                    type="default"
                    icon={<Edit size={16} />}
                    onClick={() =>
                      router.push(`/movimentacao/entrada/editar/${record.id}`)
                    }
                  />
                  <Popconfirm
                    title="Tem certeza que deseja excluir este produto?"
                    okText="Sim"
                    cancelText="Cancelar"
                    onConfirm={() => handleDelete(record.id)}
                  >
                    <Button danger icon={<Trash2 size={16} />} />
                  </Popconfirm>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
