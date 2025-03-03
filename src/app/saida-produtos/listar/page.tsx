/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  Select,
  DatePicker,
  Button,
  Spin,
  Typography,
  Card,
  Divider,
  Popconfirm,
  message,
} from "antd";
import { FileText, Eye, Edit, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ListarSaidas() {
  const router = useRouter();
  const [saidas, setSaidas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Estados para os filtros
  const [produtoFiltro, setProdutoFiltro] = useState<string | null>(null);
  const [destinoFiltro, setDestinoFiltro] = useState<string | null>(null);
  const [dataFiltro, setDataFiltro] = useState<[string, string] | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Buscar todas as saídas
      const { data: saidasData, error: saidasError } = await supabase
        .from("saidas")
        .select(
          "id, produto_id, quantidade, destino, data_saida, responsavel, numero_documento, observacoes"
        );

      // Buscar lista de produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from("produtos")
        .select("id, nome_produto");

      if (saidasError || produtosError) {
        console.error(
          "Erro ao buscar dados:",
          saidasError?.message,
          produtosError?.message
        );
      } else {
        setSaidas(saidasData || []);
        setProdutos(produtosData || []);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // 🔹 Aplicar os filtros
  const saidasFiltradas = saidas.filter((saida) => {
    if (produtoFiltro && saida.produto_id !== produtoFiltro) return false;
    if (destinoFiltro && saida.destino !== destinoFiltro) return false;
    if (dataFiltro) {
      const dataSaida = dayjs(saida.data_saida);
      if (
        dataSaida.isBefore(dayjs(dataFiltro[0])) ||
        dataSaida.isAfter(dayjs(dataFiltro[1]))
      ) {
        return false;
      }
    }
    return true;
  });

  // 🔹 Função para excluir uma saída
  const excluirSaida = async (id: string) => {
    const { error } = await supabase.from("saidas").delete().eq("id", id);
    if (error) {
      message.error("Erro ao excluir saída: " + error.message);
    } else {
      message.success("Saída excluída com sucesso!");
      setSaidas(saidas.filter((saida) => saida.id !== id));
    }
  };

  // 🔹 Função para gerar o relatório em PDF
  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RELATÓRIO DE SAÍDAS DE PRODUTOS", 105, 15, { align: "center" });

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
          "Documento",
          "Produto",
          "Quantidade",
          "Destino",
          "Data",
          "Responsável",
        ],
      ],
      body: saidasFiltradas.map((saida) => [
        saida.numero_documento,
        produtos.find((p) => p.id === saida.produto_id)?.nome_produto ||
          "Desconhecido",
        saida.quantidade,
        saida.destino,
        dayjs(saida.data_saida).format("DD/MM/YYYY"),
        saida.responsavel,
      ]),
      theme: "grid",
    });

    doc.save("Relatorio_Saidas.pdf");
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Saídas de Produtos</Title>

      {/* 🔹 Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Select
          placeholder="Filtrar por Produto"
          allowClear
          style={{ width: 200 }}
          onChange={(value) => setProdutoFiltro(value)}
        >
          {produtos.map((produto) => (
            <Option key={produto.id} value={produto.id}>
              {produto.nome_produto}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Filtrar por Destino"
          allowClear
          style={{ width: 200 }}
          onChange={(value) => setDestinoFiltro(value)}
        >
          <Option value="Hospital">Hospital</Option>
          <Option value="Farmácia">Farmácia</Option>
          <Option value="Posto de Saúde">Posto de Saúde</Option>
        </Select>

        <RangePicker
          placeholder={["Data Inicial", "Data Final"]}
          format="DD/MM/YYYY"
          onChange={(dates) =>
            setDataFiltro(
              dates && dates[0] && dates[1]
                ? [dates[0].format(), dates[1].format()]
                : null
            )
          }
        />

        <Button
          type="primary"
          onClick={() => {
            setProdutoFiltro(null);
            setDestinoFiltro(null);
            setDataFiltro(null);
          }}
        >
          Limpar Filtros
        </Button>
      </div>

      {/* 🔹 Tabela de Saídas */}
      {loading ? (
        <Spin size="large" />
      ) : (
        <Card style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "right",
              gap: 12,
            }}
          >
            <Button
              type="primary"
              icon={<FileText size={16} />}
              onClick={gerarPDF}
              style={{ marginBottom: 16 }}
            >
              Gerar Relatório PDF
            </Button>
          </div>
          <Divider />
          <Table
            dataSource={saidasFiltradas}
            columns={[
              {
                title: "Documento",
                dataIndex: "numero_documento",
                key: "documento",
              },
              {
                title: "Produto",
                dataIndex: "produto_id",
                key: "produto",
                render: (produto_id) =>
                  produtos.find((p) => p.id === produto_id)?.nome_produto ||
                  "Desconhecido",
              },
              {
                title: "Quantidade",
                dataIndex: "quantidade",
                key: "quantidade",
              },
              { title: "Destino", dataIndex: "destino", key: "destino" },
              {
                title: "Data",
                dataIndex: "data_saida",
                key: "data",
                render: (data) => dayjs(data).format("DD/MM/YYYY"),
              },
              {
                title: "Ações",
                key: "acoes",
                render: (_, record) => (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      icon={<Eye size={16} />}
                      onClick={() =>
                        router.push(`/saida-produtos/visualizar/${record.id}`)
                      }
                    />
                    <Button
                      icon={<Edit size={16} />}
                      onClick={() =>
                        router.push(`/saida-produtos/editar/${record.id}`)
                      }
                    />
                    <Popconfirm
                      title="Tem certeza?"
                      onConfirm={() => excluirSaida(record.id)}
                    >
                      <Button danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                  </div>
                ),
              },
            ]}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </Card>
      )}
    </div>
  );
}
