"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button, Card, Typography, Spin, message, Divider } from "antd";
import { FileText, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const { Title } = Typography;

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}
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
  quantidade: number;
  numero_nota_fiscal?: string;
  quantidade_minima_estoque: number;
  data_entrada: string;
  responsavel: string;
}
export default function VisualizarProduto() {
  const router = useRouter();
  const params = useParams();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  useEffect(() => {
    async function fetchProduto() {
      if (!id) return;
      const { data, error } = await supabase
        .from("movimentacoes_estoque")
        .select("*")
        .eq("id", id)
        .eq("tipo_movimentacao", "entrada") // 🔹 Garantimos que é uma ENTRADA
        .single();

      if (error) {
        message.error("Erro ao buscar produto: " + error.message);
      } else {
        setProduto(data);
      }
      setLoading(false);
    }

    fetchProduto();
  }, [id]);

  const gerarPDF = () => {
    const doc: jsPDFWithAutoTable = new jsPDF();
    if (!produto) return;

    // 🔹 Cabeçalho do relatório
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RELATÓRIO DE PRODUTO", 105, 15, { align: "center" });

    // 🔹 Informações gerais
    doc.setFontSize(12);
    doc.text(
      `Data de Geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      14,
      25
    );

    // 🔹 Seção de Identificação
    doc.setFontSize(14);
    doc.text("Identificação do Produto", 14, 40);
    autoTable(doc, {
      startY: 45,
      head: [["Campo", "Valor"]],
      body: [
        ["Código de Barras", produto.codigo_barras || "N/A"],
        ["Nome", produto.nome_produto],
        ["Tipo", produto.tipo_produto],
        ["Categoria", produto.categoria],
        ["Descrição", produto.descricao || "N/A"],
      ],
      theme: "grid",
      headStyles: { fillColor: [22, 119, 255] },
    });

    // 🔹 Seção de Origem
    doc.setFontSize(14);
    const lastY = doc.lastAutoTable?.finalY ?? 50;
    doc.text("Informações de Origem", 14, lastY + 10);

    autoTable(doc, {
      startY: lastY + 15,
      head: [["Campo", "Valor"]],
      body: [
        ["Fabricante", produto.fabricante || "N/A"],
        ["Fornecedor", produto.fornecedor || "N/A"],
        ["Número do Lote", produto.numero_lote || "N/A"],
      ],
      theme: "grid",
      headStyles: { fillColor: [22, 119, 255] },
    });

    // 🔹 Seção de Controle de Entrada
    doc.setFontSize(14);
    doc.text("Controle de Entrada", 14, lastY + 10);
    autoTable(doc, {
      startY: lastY + 15,
      head: [["Campo", "Valor"]],
      body: [
        ["Data de Fabricação", produto.data_fabricacao || "N/A"],
        ["Data de Validade", produto.data_validade || "N/A"],
        ["Data de Entrada", produto.data_entrada],
        ["Quantidade Recebida", produto.quantidade],
        ["Número da Nota Fiscal", produto.numero_nota_fiscal || "N/A"],
        ["Responsável", produto.responsavel],
      ],
      theme: "grid",
      headStyles: { fillColor: [22, 119, 255] },
    });

    doc.save(`Relatorio_${produto.nome_produto}.pdf`);
  };

  if (loading) return <Spin size="large" />;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: 24 }}>
        RELATÓRIO DE PRODUTO
      </Title>

      <Card>
        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "right",
            gap: 12,
          }}
        >
          <Button icon={<ArrowLeft size={16} />} onClick={() => router.back()}>
            Voltar
          </Button>

          <Button
            type="primary"
            icon={<FileText size={16} />}
            onClick={gerarPDF}
          >
            Gerar Relatório PDF
          </Button>
        </div>
        <Divider />
        <Title level={4} style={sectionTitleStyle}>
          1. Identificação do Produto
        </Title>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Campo</th>
              <th style={headerCellStyle}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Código de Barras", produto?.codigo_barras || "N/A"],
              ["Nome", produto?.nome_produto],
              ["Tipo", produto?.tipo_produto],
              ["Categoria", produto?.categoria],
              ["Descrição", produto?.descricao || "N/A"],
            ].map(([campo, valor], index) => (
              <tr key={index}>
                <td style={cellStyle}>
                  <strong>{campo}:</strong>
                </td>
                <td style={cellStyle}>{valor}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Title level={4} style={sectionTitleStyle}>
          2. Informações de Origem
        </Title>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Campo</th>
              <th style={headerCellStyle}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Fabricante", produto?.fabricante || "N/A"],
              ["Fornecedor", produto?.fornecedor || "N/A"],
              ["Número do Lote", produto?.numero_lote || "N/A"],
            ].map(([campo, valor], index) => (
              <tr key={index}>
                <td style={cellStyle}>
                  <strong>{campo}:</strong>
                </td>
                <td style={cellStyle}>{valor}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Title level={4} style={sectionTitleStyle}>
          3. Controle de Entrada
        </Title>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Campo</th>
              <th style={headerCellStyle}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Data de Fabricação", produto?.data_fabricacao || "N/A"],
              ["Data de Validade", produto?.data_validade || "N/A"],
              ["Data de Entrada", produto?.data_entrada],
              ["Quantidade Recebida", produto?.quantidade],
              ["Número da Nota Fiscal", produto?.numero_nota_fiscal || "N/A"],
              ["Responsável", produto?.responsavel],
            ].map(([campo, valor], index) => (
              <tr key={index}>
                <td style={cellStyle}>
                  <strong>{campo}:</strong>
                </td>
                <td style={cellStyle}>{valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// Estilos
const sectionTitleStyle: React.CSSProperties = {
  backgroundColor: "#2d88ff89",
  color: "#fff",
  padding: "8px",
  borderRadius: "4px",
  marginTop: "16px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 16,
};

const headerCellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
  backgroundColor: "#2d88ff89",
  color: "#fff",
};

const cellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
  backgroundColor: "#f9f9f9",
};
