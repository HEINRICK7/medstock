"use client";

import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table, Spin, Typography } from "antd";
import { supabase } from "@/lib/supabase";
import {
  Package,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowDownCircle,
} from "lucide-react";
import dayjs from "dayjs";

const { Title } = Typography;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState({
    totalProdutos: 0,
    emFalta: 0,
    estoqueBaixo: 0,
    proximosVencimento: 0,
    saidasUltimoMes: 0,
    produtosVencidos: 0,
  });
  const [auditoria, setAuditoria] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { count: totalProdutos } = await supabase
          .from("produtos")
          .select("id", { count: "exact" });
        const { count: emFalta } = await supabase
          .from("estoque_produtos")
          .select("id", { count: "exact" })
          .eq("quantidade", 0);
        const { count: estoqueBaixo } = await supabase
          .from("estoque_produtos")
          .select("id", { count: "exact" })
          .lt("quantidade", 5);

        const hoje = dayjs().format("YYYY-MM-DD");
        const limite = dayjs().add(30, "day").format("YYYY-MM-DD");
        const { count: proximosVencimento } = await supabase
          .from("produtos")
          .select("id", { count: "exact" })
          .gte("data_validade", hoje)
          .lte("data_validade", limite);
        const { count: produtosVencidos } = await supabase
          .from("produtos")
          .select("id", { count: "exact" })
          .lt("data_validade", hoje);

        const mesPassado = dayjs().subtract(1, "month").format("YYYY-MM-DD");
        const { count: saidasUltimoMes } = await supabase
          .from("movimentacoes_estoque")
          .select("id", { count: "exact" })
          .gte("data_movimentacao", mesPassado);

        setDados({
          totalProdutos: totalProdutos || 0,
          emFalta: emFalta || 0,
          estoqueBaixo: estoqueBaixo || 0,
          proximosVencimento: proximosVencimento || 0,
          saidasUltimoMes: saidasUltimoMes || 0,
          produtosVencidos: produtosVencidos || 0,
        });

        // 🔹 Buscar histórico de movimentações (entrada, saída, edição e exclusão)
        const { data: movimentacoes } = await supabase
          .from("auditoria_movimentacoes")
          .select("*")
          .order("data_movimentacao", { ascending: false });
        setAuditoria(movimentacoes || []);
      } catch (error) {
        console.error("Erro ao buscar dados da dashboard", error);
      }
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total de Produtos"
              value={dados.totalProdutos}
              prefix={<Package size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Produtos em Falta"
              value={dados.emFalta}
              prefix={<XCircle size={20} color="red" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Estoque Baixo"
              value={dados.estoqueBaixo}
              prefix={<AlertTriangle size={20} color="orange" />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Produtos Vencidos"
              value={dados.produtosVencidos}
              prefix={<XCircle size={20} color="volcano" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Próximos do Vencimento"
              value={dados.proximosVencimento}
              prefix={<Clock size={20} color="gold" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Saídas no Último Mês"
              value={dados.saidasUltimoMes}
              prefix={<ArrowDownCircle size={20} color="blue" />}
            />
          </Card>
        </Col>
      </Row>

      {/* 🔹 Tabela de Auditoria - Todas as movimentações */}
      <Row style={{ marginTop: 32 }}>
        <Col span={24}>
          <Card title="Histórico de Movimentações">
            <Table
              dataSource={auditoria}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              columns={[
                { title: "Usuário", dataIndex: "usuario", key: "usuario" },
                { title: "Produto", dataIndex: "nome_produto", key: "produto" },
                {
                  title: "Código de Barras",
                  dataIndex: "codigo_barras",
                  key: "codigo",
                },
                {
                  title: "Quantidade",
                  dataIndex: "quantidade",
                  key: "quantidade",
                },
                {
                  title: "Destino",
                  dataIndex: "destino",
                  key: "destino",
                  render: (destino) => destino || "-",
                },
                {
                  title: "Tipo de Movimentação",
                  dataIndex: "tipo_movimentacao",
                  key: "tipo",
                },
                {
                  title: "Data",
                  dataIndex: "data_movimentacao",
                  key: "data",
                  render: (data) => dayjs(data).format("DD/MM/YYYY HH:mm"),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {loading && (
        <Spin size="large" style={{ display: "block", marginTop: 16 }} />
      )}
    </div>
  );
}
