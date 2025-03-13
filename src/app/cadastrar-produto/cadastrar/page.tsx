"use client";

import { useEffect, useRef, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Row,
  Col,
  Divider,
  DatePicker,
  InputNumber,
  App,
} from "antd";
import type { InputRef } from "antd";
import GerenciadorLista from "@/components/GerenciadorLista";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

const { Title } = Typography;

interface Produto {
  codigo_barras: string;
  nome_produto: string;
  tipo_produto: string;
  categoria: string;
  unidade_medida: string;
  fabricante?: string;
  fornecedor?: string;
  numero_lote?: string;
  descricao?: string;
  data_fabricacao?: string;
  data_validade?: string;
  quantidade_minima_estoque: number;
}
export default function CadastrarProduto() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [codigoBarras, setCodigoBarras] = useState("");
  const qrCodeInputRef = useRef<InputRef | null>(null);
  const [api, contextHolder] = message.useMessage();

  // 📌 Foca no input de código ao carregar a página
  useEffect(() => {
    if (qrCodeInputRef.current) {
      qrCodeInputRef.current.focus();
    }
  }, []);

  // 📌 WebSocket para capturar código de barras em tempo real do Supabase
  useEffect(() => {
    const subscription = supabase
      .channel("realtime:scanned_codes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scanned_codes" },
        (payload) => {
          console.log("Novo código escaneado:", payload.new.code);
          setCodigoBarras(payload.new.code);
          form.setFieldsValue({ codigo_barras: payload.new.code });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  const handleSubmit = async (values: Produto) => {
    setLoading(true);

    const produto = {
      codigo_barras: values.codigo_barras,
      nome_produto: values.nome_produto,
      tipo_produto: values.tipo_produto,
      categoria: values.categoria,
      unidade_medida: values.unidade_medida,
      fabricante: values.fabricante || null,
      fornecedor: values.fornecedor || null,
      numero_lote: values.numero_lote || null,
      descricao: values.descricao || null,
      data_fabricacao: values.data_fabricacao
        ? dayjs(values.data_fabricacao).format("YYYY-MM-DD")
        : null,
      data_validade: values.data_validade
        ? dayjs(values.data_validade).format("YYYY-MM-DD")
        : null,
      quantidade_minima_estoque: values.quantidade_minima_estoque || 1,
    };

    const { error } = await supabase.from("produtos").insert([produto]);

    if (error) {
      api.error(`Erro ao registrar produto: ${error.message}`);
    } else {
      api.success("✅ Produto cadastrado com sucesso!");
      form.resetFields();
      setCodigoBarras("");
    }

    setLoading(false);
  };
  return (
    <App>
      {contextHolder}
      <div style={{ padding: 24 }}>
        <Title level={2}>Cadastrar Produto</Title>
        <Card style={{ padding: 24 }}>
          <Divider />
          <Form form={form} onFinish={handleSubmit} layout="vertical">
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
                <Form.Item
                  label="Nome do Produto"
                  name="nome_produto"
                  rules={[{ required: true, message: "Insira o nome" }]}
                >
                  <Input placeholder="Digite um nome" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={24} md={8}>
                <Form.Item
                  label="Concentração"
                  name="tipo_produto"
                  rules={[{ required: true, message: "Selecione o tipo" }]}
                >
                  <GerenciadorLista
                    tabela="tipos_produto"
                    nomeCampo="nome"
                    label="Concentração"
                    onSelecionar={(valor) =>
                      form.setFieldsValue({ tipo_produto: valor })
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={8}>
                <Form.Item
                  label="Forma Farmacêutica"
                  name="categoria"
                  rules={[{ required: true, message: "Selecione a categoria" }]}
                >
                  <GerenciadorLista
                    tabela="categorias"
                    nomeCampo="nome"
                    label="Forma Farmacêutica"
                    onSelecionar={(valor) =>
                      form.setFieldsValue({ categoria: valor })
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={8}>
                <Form.Item
                  label="Apresentação"
                  name="unidade_medida"
                  rules={[{ required: true, message: "Selecione a unidade" }]}
                >
                  <GerenciadorLista
                    tabela="unidades_medida"
                    nomeCampo="nome"
                    label="Apresentação"
                    onSelecionar={(valor) =>
                      form.setFieldsValue({ unidade_medida: valor })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={24} md={12}>
                <Form.Item label="Fabricante" name="fabricante">
                  <Input placeholder="Digite o nome do fabricante" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={12}>
                <Form.Item label="Fornecedor" name="fornecedor">
                  <Input placeholder="Digite o nome do fornecedor" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={24} md={8}>
                <Form.Item label="Número do Lote" name="numero_lote">
                  <Input placeholder="Digite o número do lote" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={8}>
                <Form.Item label="Data de Fabricação" name="data_fabricacao">
                  <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={8}>
                <Form.Item label="Data de Validade" name="data_validade">
                  <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Descrição" name="descricao">
              <Input.TextArea rows={3} placeholder="Digite uma descrição" />
            </Form.Item>

            <Form.Item
              label="Quantidade Mínima em Estoque"
              name="quantidade_minima_estoque"
              rules={[
                { required: true, message: "Insira a quantidade mínima" },
              ]}
            >
              <InputNumber
                min={1}
                style={{ width: "100%" }}
                placeholder="Digite a quantidade mínima"
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} block>
              Cadastrar Produto
            </Button>
          </Form>
        </Card>
      </div>
    </App>
  );
}
