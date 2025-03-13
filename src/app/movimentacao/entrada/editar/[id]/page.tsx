"use client";

import { useCallback, useEffect, useState } from "react";
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

type Produto = {
  codigo_barras: string;
  nome_produto: string;
  tipo_produto: string;
  categoria: string;
  unidade_medida: string;
  fabricante?: string;
  fornecedor?: string;
  numero_lote?: string | null;
  descricao?: string;
  data_fabricacao?: string | null;
  data_validade?: string | null;
  quantidade: number;
  numero_nota_fiscal?: string;
  quantidade_minima_estoque?: number;
  data_entrada: string;
  responsavel: string;
};

export default function EditarProduto() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const params = useParams();
  const [tipoProduto, setTipoProduto] = useState<string | null>(null);
  const [isPerecivel, setIsPerecivel] = useState<boolean>(false);
  const [api, contextHolder] = message.useMessage();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  // 🔹 Buscar os dados do produto
  const fetchMovimentacao = useCallback(async () => {
    if (!id) return;

    setLoading(true);

    // 🔹 Buscar a movimentação específica pelo ID
    const { data, error } = await supabase
      .from("movimentacoes_estoque")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      api.error("Erro ao carregar movimentação.");
      setLoading(false);
      return;
    }

    // 🔹 Preencher o formulário com os dados carregados
    form.setFieldsValue({
      ...data,
      quantidade: data.quantidade, // 🔹 Apenas este campo será editável
      data_fabricacao: data.data_fabricacao
        ? dayjs(data.data_fabricacao)
        : null,
      data_validade: data.data_validade ? dayjs(data.data_validade) : null,
      data_entrada: data.data_entrada ? dayjs(data.data_entrada) : null,
    });

    setLoading(false);
  }, [id, form, api]);

  useEffect(() => {
    fetchMovimentacao();
  }, [fetchMovimentacao]);

  const handleUpdate = async (values: Produto) => {
    setLoading(true);
  
    // 🔹 Buscar a movimentação da entrada para obter `nome_produto`
    const { data, error: fetchError } = await supabase
      .from("movimentacoes_estoque")
      .select("nome_produto")
      .eq("id", id)
      .eq("tipo_movimentacao", "entrada") // 🔹 Garantimos que é uma ENTRADA
      .single();
      console.log("Buscando movimentação com ID:", id);
      
      console.log("Resultado da busca:", data, fetchError);
      
    if (fetchError || !data?.nome_produto) {
      api.error("Erro ao obter nome do produto para auditoria.");
      setLoading(false);
      return;
    }
  
    // 🔹 Atualizar a quantidade da entrada e passar `nome_produto`
    const { error } = await supabase
      .from("movimentacoes_estoque")
      .update({
        quantidade: values.quantidade, // ✅ Apenas a quantidade será alterada
        nome_produto: data.nome_produto, // ✅ Nome do produto é passado para evitar erro na auditoria
      })
      .eq("id", id)
      .eq("tipo_movimentacao", "entrada"); // 🔹 Apenas a ENTRADA será modificada
  
    if (error) {
      api.error("Erro ao atualizar quantidade da entrada.");
    } else {
      api.success("Quantidade da entrada atualizada com sucesso!");
      router.push("/movimentacao/entrada/listar");
    }
  
    setLoading(false);
  };
  
  useEffect(() => {
    fetchMovimentacao();
  }, [fetchMovimentacao]);

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
          <Divider />
          <Form form={form} layout="vertical" onFinish={handleUpdate}>
            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                label="Código de Barras / QR Code"
                name="codigo_barras"
                rules={[{ required: true }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Digite um código" disabled />
              </Form.Item>

              <Form.Item
                label="Nome do Produto"
                name="nome_produto"
                rules={[{ required: true }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Digite um nome" disabled />
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
                  disabled
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
                <Select placeholder="Selecione" disabled>
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
              label="Data de Entrada"
              name="data_entrada"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                disabled
              />
            </Form.Item>

            <Form.Item
              label="Quantidade Recebida"
              name="quantidade"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="Responsável pela Entrada"
              name="responsavel"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Digite o nome" disabled />
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
