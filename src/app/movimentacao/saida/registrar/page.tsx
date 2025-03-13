"use client";

import { useEffect, useState } from "react";
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
} from "antd";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

interface Produto {
  id: string;
  nome_produto: string;
  codigo_barras: string;
  quantidade: number;
  estoque_minimo: number;
}

interface ProdutoSaida {
  produto_id: string;
  nome_produto: string;
  quantidade: number;
  codigo_barras: string;
}

interface SaidaProdutoForm {
  destino: string;
  data_saida: string;
  responsavel: string;
  numero_documento: string;
  observacoes?: string;
}

export default function SaidaProduto() {
  const [loading, setLoading] = useState<boolean>(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosSaida, setProdutosSaida] = useState<ProdutoSaida[]>([]);
  const [form] = Form.useForm<SaidaProdutoForm>();
  const [produtoForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [api, contextHolder] = message.useMessage();

  useEffect(() => {
    async function fetchProdutos() {
      const { data, error } = await supabase
        .from("estoque_produtos")
        .select("produto_id, nome_produto, codigo_barras, quantidade, estoque_minimo");

      if (error) {
        api.error("Erro ao buscar produtos: " + error.message);
      } else if (data) {
        setProdutos(data.map((p) => ({ ...p, id: p.produto_id })));
      }
    }

    fetchProdutos();

    form.setFieldsValue({
      numero_documento: `ND${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    });
  }, [form]);

  const adicionarProduto = (values: { produto_id: string; quantidade: number }) => {
    const produtoSelecionado = produtos.find((p) => p.id === values.produto_id);
    if (!produtoSelecionado) return;

    if (produtosSaida.some((p) => p.produto_id === values.produto_id)) {
      api.error("Produto já adicionado!");
      return;
    }

    setProdutosSaida([
      ...produtosSaida,
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
    setProdutosSaida(produtosSaida.filter((p) => p.produto_id !== produto_id));
  };

  const handleSubmit = async (values: SaidaProdutoForm) => {
    setLoading(true);

    if (produtosSaida.length === 0) {
      api.error("Adicione pelo menos um produto para registrar a saída.");
      setLoading(false);
      return;
    }

    for (const produto of produtosSaida) {
      const produtoSelecionado = produtos.find((p) => p.id === produto.produto_id);
      if (!produtoSelecionado) continue;

      if (produto.quantidade > produtoSelecionado.quantidade) {
        api.error(`Estoque insuficiente para o produto ${produto.nome_produto}.`);
        setLoading(false);
        return;
      }
    }

    const { error: insertError } = await supabase.from("movimentacoes_estoque").insert(
      produtosSaida.map((produto) => ({
        produto_id: produto.produto_id,
        tipo_movimentacao: "saida",
        codigo_barras: produto.codigo_barras,
        nome_produto: produto.nome_produto,
        unidade_medida: "unidade",
        quantidade_recebida: produto.quantidade,
        data_saida: dayjs(values.data_saida).format("YYYY-MM-DD"),
        responsavel: values.responsavel,
        destino: values.destino,
        numero_documento: values.numero_documento,
      }))
    );

    if (insertError) {
      api.error("Erro ao registrar saída: " + insertError.message);
      setLoading(false);
      return;
    }

    for (const produto of produtosSaida) {
      const novaQuantidade =
        (produtos.find((p) => p.id === produto.produto_id)?.quantidade ?? 0) -
        produto.quantidade;

      await supabase
        .from("estoque_produtos")
        .update({ quantidade: novaQuantidade })
        .eq("produto_id", produto.produto_id);
    }

    api.success("Saída registrada com sucesso!");
    form.resetFields();
    setProdutosSaida([]);
    setLoading(false);
  };

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <Title level={2}>Distribuição de Produtos</Title>
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
            dataSource={produtosSaida}
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
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                Adicionar Produto
              </Button>
            )}
          />

          <Form.Item
            label="Data de Saída"
            name="data_saida"
            rules={[{ required: true, message: "Informe a data de saída!" }]}
          >
            <DatePicker
              disabledDate={(current) => current && current.isBefore(dayjs().startOf("day"))}
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

          <Button type="primary" htmlType="submit" loading={loading} block>
            Registrar Saída
          </Button>
        </Form>
      </Card>

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
                  {produto.nome_produto} (Estoque: {produto.quantidade})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Quantidade" name="quantidade" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
