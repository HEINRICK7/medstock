"use client";

import { useEffect, useRef, useState } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Typography,
  message,
  Checkbox,
  App,
  Row,
  Col,
  QRCode,
  Modal,
  Divider,
} from "antd";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";
import type { InputRef } from "antd";
import { ScanLine } from "lucide-react";
import io from "socket.io-client";

const { Title } = Typography;
const { Option } = Select;

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
  quantidade_recebida: number;
  numero_nota_fiscal?: string;
  quantidade_minima_estoque: number;
  data_entrada: string;
  responsavel: string;
}

export default function CadastrarProduto() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const qrCodeInputRef = useRef<InputRef | null>(null);
  const [tipoProduto, setTipoProduto] = useState<string | null>(null);
  const [isPerecivel, setIsPerecivel] = useState<boolean>(false);
  const [api, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [ip, setIp] = useState("");

  useEffect(() => {
    if (qrCodeInputRef.current) {
      qrCodeInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch("/api/ip");
        const data = await response.json();

        const isProd = process.env.NODE_ENV === "production";
        const protocol = isProd ? "http://" : "http://";
        setIp(data.ip);
        setServerUrl(`${protocol}${data.ip}:3000`);
      } catch (error) {
        console.error("Erro ao buscar IP:", error);
        setServerUrl("http://localhost:3000"); // Fallback para desenvolvimento
      }
    };

    fetchIp();
  }, []);

  useEffect(() => {
    if (!ip) return;

    const isProd = process.env.NODE_ENV === "production";
    const socketUrl = isProd ? `wss://${ip}` : `ws://${ip}:3000`;

    console.log("Tentando conectar ao WebSocket:", socketUrl);

    const socket = io(socketUrl, {
      path: "/api/socketio",
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Conectado ao WebSocket no formulário!");
    });

    socket.on("mensagem", (data) => {
      console.log("📩 Código recebido:", data);
      if (data.type === "scan") {
        setCodigoBarras(data.data);
        form.setFieldsValue({ codigo_barras: data.data });
      }
    });

    return () => {
      console.log("🔌 Desconectando do WebSocket...");
      socket.disconnect();
    };
  }, [ip, form]);

  const handleTipoProdutoChange = (value: string) => {
    setTipoProduto(value);
    setIsPerecivel(false);
  };

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
      numero_lote:
        tipoProduto === "medicamento" || tipoProduto === "geral"
          ? values.numero_lote || null
          : null,
      descricao: values.descricao || null,
      data_fabricacao: values.data_fabricacao
        ? dayjs(values.data_fabricacao).format("YYYY-MM-DD")
        : null,
      data_validade:
        (tipoProduto === "medicamento" ||
          (tipoProduto === "geral" && isPerecivel)) &&
        values.data_validade
          ? dayjs(values.data_validade).format("YYYY-MM-DD")
          : null,
      quantidade_recebida: values.quantidade_recebida,
      numero_nota_fiscal: values.numero_nota_fiscal || null,
      quantidade_minima_estoque: values.quantidade_minima_estoque,
      data_entrada: dayjs(values.data_entrada).format("YYYY-MM-DD"),
      responsavel: values.responsavel,
    };

    const { error } = await supabase.from("produtos").insert([produto]);

    if (error) {
      api.error(`Erro ao registrar produto: ${error.message}`);
    } else {
      api.success("✅ Produto cadastrado com sucesso!");
      form.resetFields();
      setTipoProduto(null);
      setIsPerecivel(false);
    }

    setLoading(false);
  };

  return (
    <App>
      {contextHolder}
      <div style={{ padding: 24 }}>
        <Title level={2}>Cadastrar Produto</Title>
        <Card style={{ padding: 24 }}>
          <div
            style={{
              display: "block",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            <Title level={4}>Escaneie com seu smartphone</Title>
            <Button
              icon={<ScanLine size={16} />}
              type="primary"
              onClick={() => setIsModalOpen(true)}
            >
              Escanear
            </Button>
          </div>
          <Divider />
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col xs={24} sm={24} md={24} lg={12}>
                <Form.Item
                  label="Código de Barras / QR Code"
                  name="codigo_barras"
                  rules={[{ required: true }]}
                >
                  <Input
                    ref={qrCodeInputRef}
                    value={codigoBarras}
                    placeholder="Digite um código"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={24} lg={12}>
                <Form.Item
                  label="Nome do Produto"
                  name="nome_produto"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Digite um nome" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={24} md={24} lg={8}>
                <Form.Item
                  label="Tipo de Produto"
                  name="tipo_produto"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Selecione"
                    onChange={handleTipoProdutoChange}
                  >
                    <Option value="medicamento">Medicamento</Option>
                    <Option value="equipamento">Equipamento</Option>
                    <Option value="geral">Produto em geral</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={24} lg={8}>
                <Form.Item
                  label="Categoria"
                  name="categoria"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Selecione">
                    <Option value="analgesicos">Analgésicos</Option>
                    <Option value="antibioticos">Antibióticos</Option>
                    <Option value="equipamentos_medicos">
                      Equipamentos Médicos
                    </Option>
                    <Option value="material_consumo">
                      Material de Consumo
                    </Option>
                    <Option value="outros">Outros</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={24} lg={8}>
                <Form.Item
                  label="Unidade de Medida"
                  name="unidade_medida"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Selecione">
                    <Option value="ml">mL</Option>
                    <Option value="mg">mg</Option>
                    <Option value="unidade">Unidade</Option>
                    <Option value="frasco">Frasco</Option>
                    <Option value="caixa">Caixa</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Descrição"
              name="descricao"
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={3} placeholder="Digite uma descrição" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={24} md={24}>
                <Form.Item label="Fabricante" name="fabricante">
                  <Input placeholder="Digite o nome do fabricante" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={24}>
                <Form.Item label="Fornecedor" name="fornecedor">
                  <Input placeholder="Digite o nome do fornecedor" />
                </Form.Item>
              </Col>
            </Row>

            {tipoProduto === "geral" && (
              <Form.Item name="perecivel" valuePropName="checked">
                <Checkbox onChange={(e) => setIsPerecivel(e.target.checked)}>
                  É um produto perecível?
                </Checkbox>
              </Form.Item>
            )}

            {(tipoProduto === "medicamento" || tipoProduto === "geral") && (
              <Form.Item label="Número do Lote" name="numero_lote">
                <Input placeholder="Digite o número do lote" />
              </Form.Item>
            )}

            <Row gutter={16}>
              <Col xs={24} sm={12} md={12}>
                <Form.Item label="Data de Fabricação" name="data_fabricacao">
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              {(tipoProduto === "medicamento" ||
                (tipoProduto === "geral" && isPerecivel)) && (
                <Col xs={24} sm={12} md={12}>
                  <Form.Item label="Data de Validade" name="data_validade">
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              )}

              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  label="Data de Entrada"
                  name="data_entrada"
                  rules={[{ required: true }]}
                >
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  label="Quantidade Recebida"
                  name="quantidade_recebida"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col xxl={12} xs={24} sm={12} md={12}>
                <Form.Item
                  label="Qnt. Mínima em Estoque"
                  name="quantidade_minima_estoque"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Número da Nota Fiscal" name="numero_nota_fiscal">
              <Input placeholder="Digite o número da nota fiscal" />
            </Form.Item>

            <Form.Item
              label="Responsável pela Entrada"
              name="responsavel"
              rules={[{ required: true }]}
            >
              <Input placeholder="Digite o nome" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} block>
              Registrar Produto
            </Button>
          </Form>
        </Card>
      </div>
      <Modal
        style={{
          width: "70%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Escaneie o QR Code"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <div style={{ textAlign: "center" }}>
          <QRCode value={serverUrl.replace(/^http/, "https")} size={200} />
          <p style={{ marginTop: 10 }}>URL: {serverUrl}</p>
        </div>
      </Modal>
    </App>
  );
}
