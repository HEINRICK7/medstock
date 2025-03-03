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
  Checkbox,
  App,
  Divider,
} from "antd";
import { ArrowLeft } from "lucide-react";

import { useRouter, useParams } from "next/navigation";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";

const { Title } = Typography;
const { Option } = Select;

export default function EditarProduto() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const { id } = useParams();
  const [tipoProduto, setTipoProduto] = useState<string | null>(null);
  const [isPerecivel, setIsPerecivel] = useState<boolean>(false);
  const [api, contextHolder] = message.useMessage();

  useEffect(() => {
    if (id) {
      fetchProduto(id);
    }
  }, [id]);

  // 🔹 Buscar os dados do produto
  const fetchProduto = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      api.error("Erro ao carregar produto.");
      router.push("/entrada-produtos/listar");
    } else {
      form.setFieldsValue({
        ...data,
        data_fabricacao: data.data_fabricacao
          ? dayjs(data.data_fabricacao)
          : null,
        data_validade: data.data_validade ? dayjs(data.data_validade) : null,
        data_entrada: data.data_entrada ? dayjs(data.data_entrada) : null,
      });
      setTipoProduto(data.tipo_produto);
      setIsPerecivel(
        data.tipo_produto === "geral" && data.data_validade !== null
      );
    }
    setLoading(false);
  };

  // 🔹 Atualizar produto no Supabase
  const handleUpdate = async (values: any) => {
    setLoading(true);

    const produtoAtualizado = {
      ...values,
      data_fabricacao: values.data_fabricacao
        ? dayjs(values.data_fabricacao).format("YYYY-MM-DD")
        : null,
      data_validade:
        tipoProduto === "medicamento" ||
        (tipoProduto === "geral" && isPerecivel)
          ? dayjs(values.data_validade).format("YYYY-MM-DD")
          : null,
      data_entrada: dayjs(values.data_entrada).format("YYYY-MM-DD"),
    };

    const { error } = await supabase
      .from("produtos")
      .update(produtoAtualizado)
      .eq("id", id);

    if (error) {
      api.error("Erro ao atualizar produto.");
    } else {
      api.success("Produto atualizado com sucesso!");
      router.push("/entrada-produtos/listar");
    }

    setLoading(false);
  };

  return (
    <App>
      {contextHolder}
      <div style={{ padding: 24 }}>
        <Title level={2}>Editar Produto</Title>
        <Card style={{ padding: 24 }}>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "right",
              gap: 12,
            }}
          >
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={() => router.back()}
            >
              Voltar
            </Button>
          </div>
          <Divider/>
          <Form form={form} layout="vertical" onFinish={handleUpdate}>
            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                label="Código de Barras / QR Code"
                name="codigo_barras"
                rules={[{ required: true }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Digite um código" />
              </Form.Item>

              <Form.Item
                label="Nome do Produto"
                name="nome_produto"
                rules={[{ required: true }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Digite um nome" />
              </Form.Item>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                label="Tipo de Produto"
                name="tipo_produto"
                rules={[{ required: true }]}
                style={{ flex: 1 }}
              >
                <Select
                  placeholder="Selecione"
                  onChange={(value) => setTipoProduto(value)}
                >
                  <Option value="medicamento">Medicamento</Option>
                  <Option value="equipamento">Equipamento</Option>
                  <Option value="geral">Produto em geral</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Categoria"
                name="categoria"
                rules={[{ required: true }]}
                style={{ flex: 1 }}
              >
                <Select placeholder="Selecione">
                  <Option value="analgesicos">Analgésicos</Option>
                  <Option value="antibioticos">Antibióticos</Option>
                  <Option value="equipamentos_medicos">
                    Equipamentos Médicos
                  </Option>
                  <Option value="material_consumo">Material de Consumo</Option>
                  <Option value="outros">Outros</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              label="Descrição"
              name="descricao"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Input.TextArea rows={3} placeholder="Digite uma descrição" />
            </Form.Item>

            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                label="Fabricante"
                name="fabricante"
                style={{ flex: 1 }}
              >
                <Input placeholder="Digite o nome do fabricante" />
              </Form.Item>

              <Form.Item
                label="Fornecedor"
                name="fornecedor"
                style={{ flex: 1 }}
              >
                <Input placeholder="Digite o nome do fornecedor" />
              </Form.Item>
            </div>

            {tipoProduto === "geral" && (
              <Form.Item name="perecivel" valuePropName="checked">
                <Checkbox onChange={(e) => setIsPerecivel(e.target.checked)}>
                  É um produto perecível?
                </Checkbox>
              </Form.Item>
            )}

            {(tipoProduto === "medicamento" || tipoProduto === "geral") && (
              <Form.Item
                label="Número do Lote"
                name="numero_lote"
                style={{ flex: 1 }}
              >
                <Input placeholder="Digite o número do lote" />
              </Form.Item>
            )}

            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                label="Data de Fabricação"
                name="data_fabricacao"
                style={{ flex: 1 }}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>

              {(tipoProduto === "medicamento" ||
                (tipoProduto === "geral" && isPerecivel)) && (
                <Form.Item
                  label="Data de Validade"
                  name="data_validade"
                  style={{ flex: 1 }}
                >
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                </Form.Item>
              )}

              <Form.Item
                label="Data de Entrada"
                name="data_entrada"
                rules={[{ required: true }]}
                style={{ flex: 1 }}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </div>

            <Form.Item
              label="Quantidade Recebida"
              name="quantidade_recebida"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Número da Nota Fiscal"
              name="numero_nota_fiscal"
              style={{ flex: 1 }}
            >
              <Input placeholder="Digite o número da nota fiscal" />
            </Form.Item>

            <Form.Item
              label="Responsável pela Entrada"
              name="responsavel"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Digite o nome" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} block>
              Atualizar Produto
            </Button>
          </Form>
        </Card>
      </div>
    </App>
  );
}
