"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, Button, Spin, Typography, message, Row, Col } from "antd";
import { ArrowLeft } from "lucide-react";
import dayjs from "dayjs";

const { Title } = Typography;

interface Saida {
  id: string;
  produto_id: string;
  quantidade: number;
  destino: string;
  data_saida: string;
  responsavel: string;
  numero_documento: string;
  observacoes?: string;
}

export default function VisualizarSaida() {
  const params = useParams();
  const router = useRouter();
  const [saida, setSaida] = useState<Saida | null>(null);
  const [loading, setLoading] = useState(true);
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    async function fetchSaida() {
      const { data, error } = await supabase
        .from("saidas")
        .select("*")
        .eq("id", id)
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

  if (loading) return <Spin size="large" />;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Detalhes da Saída de Produto</Title>

      <Card>
        {saida ? (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <p>
                  <strong>Número do Documento:</strong> {saida.numero_documento}
                </p>
                <p>
                  <strong>Produto:</strong> {saida.produto_id}
                </p>
                <p>
                  <strong>Quantidade:</strong> {saida.quantidade}
                </p>
              </Col>
              <Col span={12}>
                <p>
                  <strong>Destino:</strong> {saida.destino}
                </p>
                <p>
                  <strong>Data de Saída:</strong>{" "}
                  {dayjs(saida.data_saida).format("DD/MM/YYYY")}
                </p>
                <p>
                  <strong>Responsável:</strong> {saida.responsavel}
                </p>
                <p>
                  <strong>Observações:</strong> {saida.observacoes || "Nenhuma"}
                </p>
              </Col>
            </Row>
          </>
        ) : (
          <p>Saída não encontrada.</p>
        )}
      </Card>

      <Button
        icon={<ArrowLeft size={16} />}
        onClick={() => router.back()}
        style={{ marginTop: 16 }}
      >
        Voltar
      </Button>
    </div>
  );
}
