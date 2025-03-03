/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Spin,
  message,
  Typography,
} from "antd";
import { ArrowLeft } from "lucide-react";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;

export default function EditarSaida() {
  const { id } = useParams();
  const router = useRouter();
  const [form] = Form.useForm();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSaida() {
      const { data: saida, error } = await supabase
        .from("saidas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        message.error("Erro ao buscar saída: " + error.message);
      } else {
        form.setFieldsValue({
          ...saida,
          data_saida: dayjs(saida.data_saida),
        });
      }
      setLoading(false);
    }

    async function fetchProdutos() {
      const { data: produtosData, error } = await supabase
        .from("produtos")
        .select("id, nome_produto");

      if (!error) setProdutos(produtosData || []);
    }

    fetchSaida();
    fetchProdutos();
  }, [id]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    const updatedSaida = {
      ...values,
      data_saida: dayjs(values.data_saida).format("YYYY-MM-DD"),
    };

    const { error } = await supabase
      .from("saidas")
      .update(updatedSaida)
      .eq("id", id);
    if (error) {
      message.error("Erro ao atualizar saída: " + error.message);
    } else {
      message.success("Saída atualizada com sucesso!");
      router.push("/saida-produtos/listar");
    }
    setLoading(false);
  };

  if (loading) return <Spin size="large" />;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Editar Saída</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Produto"
            name="produto_id"
            rules={[{ required: true }]}
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

          <Form.Item
            label="Destino"
            name="destino"
            rules={[{ required: true }]}
          >
            <Select placeholder="Selecione o destino">
              <Option value="Hospital">Hospital</Option>
              <Option value="Farmácia">Farmácia</Option>
              <Option value="Posto de Saúde">Posto de Saúde</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Data de Saída"
            name="data_saida"
            rules={[{ required: true }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Responsável"
            name="responsavel"
            rules={[{ required: true }]}
          >
            <Input placeholder="Nome do responsável" />
          </Form.Item>

          <Form.Item label="Observações" name="observacoes">
            <Input.TextArea
              rows={3}
              placeholder="Observações sobre a saída (opcional)"
            />
          </Form.Item>

          <div style={{ display: "flex", gap: 12 }}>
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={() => router.back()}
            >
              Voltar
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Salvar Alterações
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
