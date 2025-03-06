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
  App,
} from "antd";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";

const { Title } = Typography;
const { Option } = Select;

interface Produto {
  id: string;
  nome_produto: string;
  codigo_barras: string;
  quantidade_recebida: number;
  quantidade_minima_estoque: number;
}

interface SaidaProdutoForm {
  produto_id: string;
  quantidade: number;
  destino: string;
  data_saida: string;
  responsavel: string;
  numero_documento: string;
  observacoes?: string;
}
interface ProdutoListagem {
  id: string;
  nome_produto: string;
  quantidade_recebida: number;
  quantidade_minima_estoque: number;
  codigo_barras: string;
}
export default function SaidaProduto() {
  const [loading, setLoading] = useState<boolean>(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [form] = Form.useForm<SaidaProdutoForm>();
  const [api, contextHolder] = message.useMessage();

  useEffect(() => {
    async function fetchProdutos() {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome_produto, quantidade_recebida");

      if (error) {
        api.error("Erro ao buscar produtos: " + error.message);
      } else if (data) {
        setProdutos(data as ProdutoListagem[]);
      }
    }

    fetchProdutos();

    // Gerar número do documento automaticamente
    form.setFieldsValue({
      numero_documento: `ND${Math.floor(
        1000000000 + Math.random() * 9000000000
      )}`,
    });
  }, [form, api]);

  const handleSubmit = async (values: SaidaProdutoForm) => {
    setLoading(true);

    const produtoSelecionado = produtos.find((p) => p.id === values.produto_id);
    if (!produtoSelecionado) {
      api.error("Produto não encontrado.");
      setLoading(false);
      return;
    }

    if (values.quantidade > produtoSelecionado.quantidade_recebida) {
      api.error("Estoque insuficiente para essa saída.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("saidas").insert([
      {
        produto_id: values.produto_id,
        quantidade: values.quantidade,
        destino: values.destino,
        data_saida: dayjs(values.data_saida).format("YYYY-MM-DD"),
        responsavel: values.responsavel,
        numero_documento: values.numero_documento,
        observacoes: values.observacoes || null,
      },
    ]);

    if (insertError) {
      api.error("Erro ao registrar saída: " + insertError.message);
      setLoading(false);
      return;
    }

    // 🔹 Atualizar o estoque do produto no banco de dados
    const novaQuantidade =
      produtoSelecionado.quantidade_recebida - values.quantidade;

    const { error: updateError } = await supabase
      .from("produtos")
      .update({ quantidade_recebida: novaQuantidade })
      .eq("id", values.produto_id);

    if (updateError) {
      api.error("Erro ao atualizar estoque: " + updateError.message);
    } else {
      api.success("✅ Saída registrada com sucesso e estoque atualizado!");
      form.resetFields();
      form.setFieldsValue({
        numero_documento: `ND${Math.floor(
          1000000000 + Math.random() * 9000000000
        )}`,
      });

      // Atualizar a lista de produtos para refletir o novo estoque
      setProdutos((prev) =>
        prev.map((p) =>
          p.id === values.produto_id
            ? { ...p, quantidade_recebida: novaQuantidade }
            : p
        )
      );
    }

    setLoading(false);
  };

  return (
    <App>
      {contextHolder}
      <div style={{ padding: 24 }}>
        <Title level={2}>Distribuição de Produtos</Title>
        <Card>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Produtos"
              name="produto_id"
              rules={[{ required: true, message: "Selecione um produto!" }]}
            >
              <Select
                showSearch
                placeholder="Selecione um produto"
                filterOption={(input, option) =>
                  option?.label.toLowerCase().includes(input.toLowerCase()) ??
                  false
                }
                options={produtos.map((produto) => ({
                  label: `${produto.nome_produto} (Estoque: ${produto.quantidade_recebida})`,
                  value: produto.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Quantidade"
              name="quantidade"
              rules={[{ required: true, message: "Informe a quantidade!" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>

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

            <Form.Item
              label="Data de Saída"
              name="data_saida"
              rules={[{ required: true, message: "Informe a data de saída!" }]}
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

            <Form.Item label="Número do Documento" name="numero_documento">
              <Input disabled />
            </Form.Item>

            <Form.Item label="Observações" name="observacoes">
              <Input.TextArea
                rows={3}
                placeholder="Digite observações (opcional)"
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} block>
              Registrar Saída
            </Button>
          </Form>
        </Card>
      </div>
    </App>
  );
}
