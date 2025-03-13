"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button, Card, Typography, Spin, message, Divider } from "antd";
import { FileText, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

const { Title } = Typography;

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

interface Saida {
  id: string;
  nome_produto: string;
  quantidade: number;
  destino: string;
  data_saida: string;
  responsavel: string;
  numero_documento: string;
  observacoes?: string;
}

export default function VisualizarSaida() {
  const router = useRouter();
  const params = useParams();
  const [saida, setSaida] = useState<Saida | null>(null);
  const [loading, setLoading] = useState(true);
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    async function fetchSaida() {
      if (!id) return;
      const { data, error } = await supabase
        .from("movimentacoes_estoque")
        .select("*")
        .eq("id", id)
        .eq("tipo_movimentacao", "saida")
        .single();

      if (error) {
        message.error("Erro ao buscar saída: " + error.message);
      } else {
        setSaida(data);
      }
      setLoading(false);
    }

    fetchSaida();
  }, [id]);

  const gerarPDF = () => {
    if (!saida) return;
    const doc: jsPDFWithAutoTable = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RELATÓRIO DE SAÍDA DE PRODUTO", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(
      `Data de Geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      14,
      25
    );

    doc.setFontSize(14);
    doc.text("1. Informações da Saída", 14, 40);
    autoTable(doc, {
      startY: 45,
      head: [["Campo", "Valor"]],
      body: [
        ["Número do Documento", saida.numero_documento],
        ["Produto", saida.nome_produto],
        ["Quantidade", saida.quantidade],
        ["Destino", saida.destino],
        ["Data de Saída", dayjs(saida.data_saida).format("DD/MM/YYYY")],
        ["Responsável", saida.responsavel],
        ["Observações", saida.observacoes || "Nenhuma"],
      ],
      theme: "grid",
      headStyles: { fillColor: [22, 119, 255] },
    });

    doc.save(`Relatorio_Saida_${saida.nome_produto}.pdf`);
  };

  if (loading) return <Spin size="large" />;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: 24 }}>
        RELATÓRIO DE SAÍDA DE PRODUTO
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
          1. Informações da Saída
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
              ["Número do Documento", saida?.numero_documento],
              ["Produto", saida?.nome_produto],
              ["Quantidade", saida?.quantidade],
              ["Destino", saida?.destino],
              ["Data de Saída", dayjs(saida?.data_saida).format("DD/MM/YYYY")],
              ["Responsável", saida?.responsavel],
              ["Observações", saida?.observacoes || "Nenhuma"],
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

// **Estilos**
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
