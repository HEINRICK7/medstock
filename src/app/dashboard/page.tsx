"use client";

import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Spin } from "antd";
import { supabase } from "@/lib/supabase";
import {
  Package,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowDownCircle,
} from "lucide-react";
import dayjs from "dayjs";
import {
  BarChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  const [categoriasDistribuidas, setCategoriasDistribuidas] = useState([]);
  const [movimentacaoMensal, setMovimentacaoMensal] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { count: totalProdutos } = await supabase
          .from("produtos")
          .select("id", { count: "exact" });

        const { count: emFalta } = await supabase
          .from("produtos")
          .select("id", { count: "exact" })
          .eq("quantidade_recebida", 0);

        const { count: estoqueBaixo } = await supabase
          .from("estoque_baixo") // Usando a View
          .select("id", { count: "exact" });

        const hoje = dayjs().format("YYYY-MM-DD");
        const limite = dayjs().add(30, "day").format("YYYY-MM-DD");
        const { count: proximosVencimento } = await supabase
          .from("produtos")
          .select("id", { count: "exact" })
          .gte("data_validade", hoje)
          .lte("data_validade", limite);

        // Buscar Produtos Vencidos
        const { count: produtosVencidos } = await supabase
          .from("produtos")
          .select("id", { count: "exact" })
          .lt("data_validade", hoje);

        const mesPassado = dayjs().subtract(1, "month").format("YYYY-MM-DD");
        const { count: saidasUltimoMes } = await supabase
          .from("saidas")
          .select("id", { count: "exact" })
          .gte("data_saida", mesPassado);

        setDados({
          totalProdutos: totalProdutos || 0,
          emFalta: emFalta || 0,
          estoqueBaixo: estoqueBaixo || 0,
          proximosVencimento: proximosVencimento || 0,
          saidasUltimoMes: saidasUltimoMes || 0,
          produtosVencidos: produtosVencidos || 0,
        });

        // Buscar categorias distribuídas
        const { data: categoriasData } = await supabase.rpc(
          "categorias_distribuidas"
        );
        setCategoriasDistribuidas(categoriasData || []);

        // Buscar movimentação mensal
        const { data: movimentacaoData } = await supabase.rpc(
          "movimentacao_mensal"
        );
        setMovimentacaoMensal(movimentacaoData || []);
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

      <Row gutter={16} style={{ marginTop: 32 }}>
        <Col xs={24} sm={12} md={12}>
          <Card title="Categorias Mais Distribuídas">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoriasDistribuidas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12}>
          <Card title="Entrada e Saída de Produtos">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={movimentacaoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data_saida" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sum" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {loading && (
        <Spin size="large" style={{ display: "block", marginTop: 16 }} />
      )}
    </div>
  );
}
