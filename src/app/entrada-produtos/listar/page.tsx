/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from "antd";
import { Eye, Edit, Trash2, FileText, Search, RefreshCcw } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ListarProdutos() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    nome: "",
    categoria: "",
    dataEntrada: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    estoqueBaixo: false,
  });

  const router = useRouter();

  useEffect(() => {
    fetchProdutos();
  }, []);

  async function fetchProdutos() {
    setLoading(true);
    let query = supabase.from("produtos").select("*");

    if (filters.nome) {
      query = query.ilike("nome_produto", `%${filters.nome}%`);
    }
    if (filters.categoria) {
      query = query.eq("categoria", filters.categoria);
    }
    if (filters.dataEntrada) {
      const [start, end] = filters.dataEntrada;
      query = query.gte("data_entrada", start.format("YYYY-MM-DD"));
      query = query.lte("data_entrada", end.format("YYYY-MM-DD"));
    }
    if (filters.estoqueBaixo) {
      query = query.lte("quantidade_recebida", 10);
    }

    const { data, error } = await query;
    if (error) {
      message.error("Erro ao buscar produtos: " + error.message);
    } else {
      setProdutos(data || []);
    }
    setLoading(false);
  }

  function gerarPDF() {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RELATÓRIO DE PRODUTOS", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString()}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [["Código", "Nome", "Categoria", "Quantidade", "Data de Entrada"]],
      body: produtos.map((p) => [
        p.codigo_barras,
        p.nome_produto,
        p.categoria,
        p.quantidade_recebida,
        p.data_entrada,
      ]),
      theme: "grid",
    });

    doc.save(`Relatorio_Produtos.pdf`);
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Listar Produtos</h2>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={16} sm={16} lg={5}>
            <Input
              placeholder="Nome do Produto"
              value={filters.nome}
              onChange={(e) => setFilters({ ...filters, nome: e.target.value })}
            />
          </Col>
          <Col xs={24} md={8} sm={8} lg={4}>
            <Select
              placeholder="Categoria"
              value={filters.categoria}
              onChange={(value) => setFilters({ ...filters, categoria: value })}
              style={{ width: "100%" }}
            >
              <Option value="">Todas</Option>
              <Option value="analgesicos">Analgésicos</Option>
              <Option value="equipamentos_medicos">Equipamentos Médicos</Option>
              <Option value="material_consumo">Material de Consumo</Option>
            </Select>
          </Col>
          <Col xs={24} md={24} sm={24} lg={8}>
            <RangePicker
              onChange={(dates) =>
                setFilters({
                  ...filters,
                  dataEntrada: dates as [dayjs.Dayjs, dayjs.Dayjs],
                })
              }
              style={{ width: "100%" }}
            />
          </Col>
          <Col
            xs={12}
            sm={6}
            md={4}
            lg={4}
            style={{ display:"flex",flexDirection:"row" }}
          >
            <Button
              type="primary"
              icon={<Search size={16} />}
              onClick={fetchProdutos}
              style={{ width: "100%", marginRight: 10 }}
            >
              Filtrar
            </Button>
            <Button
              icon={<RefreshCcw size={16} />}
              onClick={() => {
                setFilters({
                  nome: "",
                  categoria: "",
                  dataEntrada: null,
                  estoqueBaixo: false,
                });
                fetchProdutos();
              }}
              style={{ width: "100%" }}
            >
              Limpar
            </Button>
          </Col>
        </Row>
      </div>

      <Card style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "right",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Button
            type="primary"
            icon={<FileText size={16} />}
            onClick={gerarPDF}
          >
            Gerar Relatório
          </Button>
        </div>

        <Table
          dataSource={produtos}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          scroll={{ x: 800 }} // Para garantir que a tabela seja rolável em telas menores
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
              dataIndex: "quantidade_recebida",
              key: "quantidade_recebida",
            },
            {
              title: "Data de Entrada",
              dataIndex: "data_entrada",
              key: "data_entrada",
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
                      router.push(`/entrada-produtos/visualizar/${record.id}`)
                    }
                  />
                  <Button
                    type="default"
                    icon={<Edit size={16} />}
                    onClick={() =>
                      router.push(`/entrada-produtos/editar/${record.id}`)
                    }
                  />
                  <Button
                    type="primary"
                    danger
                    icon={<Trash2 size={16} />}
                    onClick={() => console.log("Excluir", record.id)}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
