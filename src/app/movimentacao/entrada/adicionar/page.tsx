"use client";

import { useEffect, useRef, useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Typography,
  message,
  App,
  Row,
  Col,
  Divider,
} from "antd";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";
import type { InputRef } from "antd";

const { Title } = Typography;

interface Produto {
  codigo_barras: string;
  nome_produto: string;
  tipo_produto: string;
  categoria: string;
  unidade_medida: string;
  quantidade: number;
  data_entrada: string;
  responsavel: string;
  produto_id?: string;
  destino?: string;
  numero_documento?: string;
  observacoes?: string;
}

export default function EntradaProduto() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const qrCodeInputRef = useRef<InputRef | null>(null);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [api, contextHolder] = message.useMessage();

  useEffect(() => {
    if (qrCodeInputRef.current) {
      qrCodeInputRef.current.focus();
    }
  }, []);

  // Escaneamento e preenchimento automático
  useEffect(() => {
    const subscription = supabase
      .channel("realtime:scanned_codes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scanned_codes" },
        async (payload) => {
          const scannedCode = payload.new.code;
          setCodigoBarras(scannedCode);
          form.setFieldsValue({ codigo_barras: scannedCode });

          // Buscar produto no banco de dados
          const { data, error } = await supabase
            .from("produtos")
            .select(
              "codigo_barras, nome_produto, tipo_produto, categoria, unidade_medida"
            )
            .eq("codigo_barras", scannedCode)
            .single();

          if (error || !data) {
            api.warning(
              "⚠ Produto não encontrado. Cadastre-o antes de continuar."
            );
            return;
          }

          // Preencher os campos automaticamente
          form.setFieldsValue({
            nome_produto: data.nome_produto,
            tipo_produto: data.tipo_produto,
            categoria: data.categoria,
            unidade_medida: data.unidade_medida,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleSubmit = async (values: Produto) => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      api.error("⚠ Erro ao obter usuário autenticado. Faça login novamente.");
      setLoading(false);
      return;
    }
    const { data: produto, error: produtoError } = await supabase
      .from("produtos")
      .select("id")
      .eq("codigo_barras", values.codigo_barras)
      .single();

    if (produtoError || !produto) {
      api.error("⚠ Produto não encontrado. É necessário cadastrá-lo primeiro.");
      setLoading(false);
      return;
    }
    const entradaProduto = {
      produto_id: produto.id,
      tipo_movimentacao: "entrada",
      codigo_barras: values.codigo_barras,
      nome_produto: values.nome_produto,
      tipo_produto: values.tipo_produto,
      categoria: values.categoria,
      unidade_medida: values.unidade_medida,
      quantidade: values.quantidade,
      data_entrada: dayjs().format("YYYY-MM-DD"),
      responsavel: values.responsavel,
    };
    await supabase.from("auditoria_movimentacoes").insert([
      {
        produto_id: values.produto_id,
        usuario: "admin", // Aqui pode ser o nome do usuário autenticado
        acao: "saida",
        quantidade: values.quantidade,
        destino: values.destino,
        numero_documento: values.numero_documento,
        observacoes: values.observacoes || null,
      },
    ]);
    console.log("🔄 Dados enviados:", entradaProduto);

    const { error } = await supabase
      .from("movimentacoes_estoque")
      .insert([entradaProduto]);

    if (error) {
      api.error(`Erro ao registrar entrada: ${error.message}`);
    } else {
      api.success("✅ Entrada de produto registrada com sucesso!");
      form.resetFields();
      setCodigoBarras("");
    }

    setLoading(false);
  };

  return (
    <App>
      {contextHolder}
      <div style={{ padding: 24 }}>
        <Title level={2}>Registrar Entrada de Produto</Title>
        <Card style={{ padding: 24 }}>
          <Divider />
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              data_saida: dayjs(),
            }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  label="Código de Barras / QR Code"
                  name="codigo_barras"
                  rules={[
                    { required: true, message: "Insira o código de barras" },
                  ]}
                >
                  <Input
                    ref={qrCodeInputRef}
                    value={codigoBarras}
                    placeholder="Escaneie ou digite um código"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={12}>
                <Form.Item label="Nome do Produto" name="nome_produto">
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={24} md={8}>
                <Form.Item label="Concentração" name="tipo_produto">
                  <Input disabled />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={8}>
                <Form.Item label="Forma Farmacêutica" name="categoria">
                  <Input disabled />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={8}>
                <Form.Item label="Apresentação" name="unidade_medida">
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  label="Quantidade Recebida"
                  name="quantidade"
                  rules={[
                    {
                      required: true,
                      message: "Informe a quantidade recebida",
                    },
                  ]}
                >
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  initialValue={dayjs()}
                  label="Data de Entrada"
                  name="data_entrada"
                >
                  <DatePicker
                    value={dayjs()}
                    disabled
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Responsável pela Entrada"
              name="responsavel"
              rules={[{ required: true, message: "Insira o responsável" }]}
            >
              <Input placeholder="Digite o nome" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} block>
              Registrar Entrada
            </Button>
          </Form>
        </Card>
      </div>
    </App>
  );
}
