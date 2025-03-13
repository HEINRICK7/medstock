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
  Table,
  Modal,
  Divider,
} from "antd";
import SignatureCanvas from "react-signature-canvas";

import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

interface Produto {
  id: string;
  nome_produto: string;
  codigo_barras: string;
  estoque: number;
}

interface ProdutoSolicitacao {
  produto_id: string;
  nome_produto: string;
  quantidade: number;
  codigo_barras: string;
}

interface SolicitacaoForm {
  destino: string;
  data_pedido: string;
  responsavel: string;
}

export default function Solicitacoes() {
  const [loading, setLoading] = useState<boolean>(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosSolicitados, setProdutosSolicitados] = useState<
    ProdutoSolicitacao[]
  >([]);
  const [form] = Form.useForm<SolicitacaoForm>();
  const [produtoForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [api, contextHolder] = message.useMessage();
  const [assinaturaRequerente, setAssinaturaRequerente] = useState<
    string | null
  >(null);
  const [usuarioLogado, setUsuarioLogado] = useState<string | null>(null);
  const assinaturaRef = useRef<SignatureCanvas | null>(null);
  const [modalAssinaturaVisivel, setModalAssinaturaVisivel] = useState(false);
  const [usuario, setUsuario] = useState<{
    nome: string;
    cargo: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    async function fetchProdutos() {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome_produto, codigo_barras, estoque");

      if (error) {
        api.error("Erro ao buscar produtos: " + error.message);
      } else {
        setProdutos(data);
      }
    }

    fetchProdutos();
  }, []);

  useEffect(() => {
    const userStorage = localStorage.getItem("usuario");
    if (userStorage) {
      setUsuario(JSON.parse(userStorage));
    }
  }, []);
  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        api.error("Erro ao obter usuário logado.");
        return;
      }

      form.setFieldsValue({ responsavel: data.user.user_metadata.nome });
      setUsuarioLogado(data.user.user_metadata.nome); // 🔹 Para exibir abaixo da assinatura
    }

    fetchUser();
  }, [form]);

  const adicionarProduto = (values: {
    produto_id: string;
    quantidade: number;
  }) => {
    const produtoSelecionado = produtos.find((p) => p.id === values.produto_id);
    if (!produtoSelecionado) return;

    if (produtosSolicitados.some((p) => p.produto_id === values.produto_id)) {
      api.error("Produto já adicionado!");
      return;
    }

    setProdutosSolicitados([
      ...produtosSolicitados,
      {
        produto_id: values.produto_id,
        nome_produto: produtoSelecionado.nome_produto,
        quantidade: values.quantidade,
        codigo_barras: produtoSelecionado.codigo_barras,
      },
    ]);

    setModalVisible(false);
    produtoForm.resetFields();
  };

  const removerProduto = (produto_id: string) => {
    setProdutosSolicitados(
      produtosSolicitados.filter((p) => p.produto_id !== produto_id)
    );
  };

  const handleSubmit = async (values: SolicitacaoForm) => {
    setLoading(true);

    if (!assinaturaRequerente) {
      api.error("Por favor, assine antes de enviar a solicitação.");
      setLoading(false);
      return;
    }

    if (produtosSolicitados.length === 0) {
      api.error("Adicione pelo menos um produto para registrar a solicitação.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      api.error("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const assinaturaBase64 = assinaturaRef.current?.toDataURL(); // Captura assinatura

    // Criar a solicitação vinculando ao usuário logado
    const { data: solicitacao, error: solicitacaoError } = await supabase
      .from("solicitacoes")
      .insert([
        {
          usuario_id: user.id, // 🔹 Associando a solicitação ao usuário logado
          destino: values.destino,
          data_pedido: dayjs(values.data_pedido).format("YYYY-MM-DD"),
          responsavel: values.responsavel,
          assinatura_requerente: assinaturaBase64,
          nome_requerente: usuario?.nome,
          cargo_requerente: usuario?.cargo,
          status: "Pendente",
        },
      ])
      .select("id")
      .single();

    if (solicitacaoError) {
      api.error("Erro ao criar solicitação: " + solicitacaoError.message);
      setLoading(false);
      return;
    }

    // Criar os produtos vinculados à solicitação
    const produtosParaInserir = produtosSolicitados.map((produto) => ({
      solicitacao_id: solicitacao.id,
      produto_id: produto.produto_id,
      quantidade: produto.quantidade,
    }));

    const { error: produtosError } = await supabase
      .from("produtos_solicitados")
      .insert(produtosParaInserir);

    if (produtosError) {
      api.error("Erro ao adicionar produtos: " + produtosError.message);
      setLoading(false);
      return;
    }

    api.success("✅ Solicitação enviada com sucesso!");
    form.resetFields();
    setProdutosSolicitados([]);
    assinaturaRef.current?.clear();
    setLoading(false);
  };

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <Title level={2}>Solicitação de Produtos</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Destino"
            name="destino"
            rules={[{ required: true, message: "Selecione um destino!" }]}
          >
            <Select placeholder="Selecione um destino">
              <Option value="Hospital">Hospital</Option>
              <Option value="Farmácia">Farmácia</Option>
              <Option value="Posto de Saúde">Posto de Saúde</Option>
            </Select>
          </Form.Item>

          <Table
            dataSource={produtosSolicitados}
            columns={[
              {
                title: "Produto",
                dataIndex: "nome_produto",
              },
              {
                title: "Quantidade",
                dataIndex: "quantidade",
                align: "center",
              },
              {
                title: "Ações",
                dataIndex: "acao",
                render: (_, record) => (
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removerProduto(record.produto_id)}
                  />
                ),
                align: "center",
              },
            ]}
            rowKey="produto_id"
            bordered
            title={() => (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
              >
                Adicionar Produto
              </Button>
            )}
          />

          <Form.Item
            label="Data do Pedido"
            name="data_pedido"
            rules={[{ required: true, message: "Informe a data do Pedido!" }]}
          >
            <DatePicker
              disabledDate={(current) =>
                current && current.isBefore(dayjs().startOf("day"))
              }
              placeholder="Selecione uma data"
              defaultValue={dayjs()}
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="Responsável"
            name="responsavel"
            rules={[{ required: true, message: "Informe o responsável!" }]}
          >
            <Input placeholder="Digite o nome do responsável" />
          </Form.Item>
          <Form.Item label="Assinatura do Requerente" required>
            <div
              style={{
                border: "2px solid #ccc",
                borderRadius: 5,
                padding: 10,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              {assinaturaRequerente ? (
                <img
                  src={assinaturaRequerente}
                  alt="Assinatura do requerente"
                  style={{
                    width: 800,
                    maxWidth: 800,
                    height: "auto",
                  }}
                />
              ) : (
                <p style={{ color: "#aaa" }}>Nenhuma assinatura registrada</p>
              )}

              <Button
                type="primary"
                onClick={() => setModalAssinaturaVisivel(true)}
              >
                Assinar
              </Button>
            </div>
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block>
            Enviar Solicitação
          </Button>
        </Form>
      </Card>

      {/* MODAL PARA ADICIONAR PRODUTOS */}
      <Modal
        title="Adicionar Produto"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => produtoForm.submit()}
        okText="Adicionar"
      >
        <Form form={produtoForm} layout="vertical" onFinish={adicionarProduto}>
          <Form.Item
            label="Produto"
            name="produto_id"
            rules={[{ required: true, message: "Selecione um produto!" }]}
          >
            <Select placeholder="Selecione um produto">
              {produtos.map((produto) => (
                <Option key={produto.id} value={produto.id}>
                  {produto.nome_produto}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Quantidade"
            name="quantidade"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Assinar Documento"
        open={modalAssinaturaVisivel}
        onCancel={() => setModalAssinaturaVisivel(false)}
        footer={null}
        width="100vw"
        style={{ top: 0 }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "80vh", // Modal ocupa 80% da altura da tela
            padding: 20,
          }}
        >
          <div
            style={{
              width: "80%", // Largura ajustada para 80% do modal
              height: "80%", // Altura ajustada para 80% do modal
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <SignatureCanvas
              ref={assinaturaRef}
              penColor="black"
              canvasProps={{
                width: 2000,
                height: 500,
                className: "signatureCanvas",
                style: { border: "1px solid #ddd" },
              }}
            />
            <Divider />
            <Title level={3} style={{ margin: 2, color: "#8d8d8d" }}>
              {usuario?.nome}
            </Title>
            <Divider
              style={{ border: "1px solid #888888", padding: 0, margin: 0 }}
            />
            <Title level={5} style={{ margin: 2, color: "#b8b8b8" }}>
              {usuario?.cargo}
            </Title>
            <Divider />
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <Button
              onClick={() => assinaturaRef.current?.clear()}
              type="default"
              danger
            >
              Limpar
            </Button>
            <Button
              type="primary"
              onClick={() => {
                if (assinaturaRef.current) {
                  setAssinaturaRequerente(
                    assinaturaRef.current.toDataURL("image/png")
                  );
                  setModalAssinaturaVisivel(false); // Fechar o modal após salvar
                }
              }}
            >
              Salvar Assinatura
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
