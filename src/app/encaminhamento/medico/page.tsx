"use client";

import { useState, useEffect } from "react";
import { Card, Form, Input, Button, Select, message, Table, Space } from "antd";
import { supabase } from "@/lib/supabase";
import { SearchOutlined, DeleteOutlined } from "@ant-design/icons";

const { Option } = Select;

interface Paciente {
  nome: string;
  data_nascimento: string;
  sexo: string;
}
interface ProdutoRelacionado {
  id: string;
  nome_produto: string;
}

interface Medicamento {
  id: string;
  nome: string;
  quantidade_disponivel: number;
  produtos?: ProdutoRelacionado;
}

interface PrescricaoForm {
  paciente_sus: string;
  nome_paciente: string;
  data_nascimento: string;
  sexo: string;
}

export default function PrescricaoMedica() {
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm<PrescricaoForm>();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [itensPrescricao, setItensPrescricao] = useState<
    { id: string; nome: string; quantidade: number }[]
  >([]);

  useEffect(() => {
    buscarMedicamentos();
  }, []);

  async function buscarPaciente() {
    const numeroSUS = form.getFieldValue("paciente_sus");
    if (!numeroSUS) {
      message.warning("Informe o número do SUS.");
      return;
    }

    const { data, error } = await supabase
      .from("usuarios_sus")
      .select("nome, data_nascimento, sexo")
      .eq("numero_sus", numeroSUS)
      .single();

    if (error || !data) {
      message.error("Paciente não encontrado.");
      return;
    }

    setPaciente(data);
    form.setFieldsValue({
      nome_paciente: data.nome,
      data_nascimento: data.data_nascimento,
      sexo: data.sexo,
    });
  }

  async function buscarMedicamentos(value?: string) {
    let query = supabase
      .from("estoque_farmacia")
      .select("produto_id, quantidade, produtos (id, nome_produto)");
  
    if (value) {
      query = query.ilike("produtos.nome_produto", `%${value}%`);
    }
  
    const { data, error } = await query;
  
    if (error) {
      message.error("Erro ao buscar medicamentos.");
      return;
    }
  
    // 🔹 Garante que `produtos` é um objeto e não um array
    const medicamentosFormatados: Medicamento[] = data
      .map((item) => {
        if (!item.produtos) return null; // Se não houver produto, retorna null
        return {
          id: item.produtos.id,
          nome: item.produtos.nome_produto,
          quantidade_disponivel: item.quantidade ?? 0,
        };
      })
      .filter((item): item is Medicamento => item !== null); // 🔹 Remove null e assegura o tipo
  
    setMedicamentos(medicamentosFormatados);
  }
  
  
  function adicionarMedicamento(produtoId: string) {
    const medicamento = medicamentos.find((m) => m.id === produtoId);
    if (!medicamento) return;

    if (itensPrescricao.some((item) => item.id === produtoId)) {
      message.warning("Medicamento já adicionado.");
      return;
    }

    setItensPrescricao([
      ...itensPrescricao,
      { id: medicamento.id, nome: medicamento.nome, quantidade: 1 },
    ]);
  }

  function removerMedicamento(produtoId: string) {
    setItensPrescricao(itensPrescricao.filter((item) => item.id !== produtoId));
  }

  async function onFinish(values: PrescricaoForm) {
    setLoading(true);
    const medico_id = (await supabase.auth.getUser()).data.user?.id;

    if (!medico_id) {
      message.error("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    try {
      const { data: prescricao, error: prescricaoError } = await supabase
        .from("prescricoes")
        .insert([
          {
            paciente_sus: values.paciente_sus,
            nome_paciente: paciente?.nome,
            medico_id,
          },
        ])
        .select()
        .single();

      if (prescricaoError) throw new Error(prescricaoError.message);

      const itensData = itensPrescricao.map((item) => ({
        prescricao_id: prescricao.id,
        produto_id: item.id,
        quantidade: item.quantidade,
      }));

      const { error: itensError } = await supabase
        .from("itens_prescricao")
        .insert(itensData);
      if (itensError) throw new Error(itensError.message);

      message.success("Prescrição registrada com sucesso!");
      form.resetFields();
      setItensPrescricao([]);
      setPaciente(null);
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Erro: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      title="Prescrição Médica"
      style={{ maxWidth: "90%", margin: "auto", marginTop: 20 }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Space.Compact style={{ display: "flex", gap: "8px" }}>
          <Form.Item
            name="paciente_sus"
            rules={[{ required: true, message: "Informe o número do SUS." }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="Digite o número do SUS" />
          </Form.Item>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={buscarPaciente}
          >
            Buscar
          </Button>
        </Space.Compact>

        <Form.Item label="Nome do Paciente">
          <Input value={paciente?.nome} disabled />
        </Form.Item>

        <Form.Item label="Data de Nascimento">
          <Input value={paciente?.data_nascimento} disabled />
        </Form.Item>

        <Form.Item label="Sexo">
          <Input value={paciente?.sexo} disabled />
        </Form.Item>

        <Form.Item label="Medicamentos">
          <Select
            placeholder="Digite o nome do medicamento"
            showSearch
            onSearch={(value) => {
              if (value.trim().length > 0) buscarMedicamentos(value);
            }}
            onFocus={() => buscarMedicamentos()} // 🔹 Carrega os medicamentos ao abrir o select
            onChange={adicionarMedicamento}
            filterOption={false}
            style={{ width: "100%" }}
          >
            {medicamentos.map((med) => (
              <Option
                key={med.id}
                value={med.id}
                disabled={itensPrescricao.some((item) => item.id === med.id)}
              >
                {med.nome} - {med.quantidade_disponivel} disponíveis
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Table
          dataSource={itensPrescricao}
          rowKey="id"
          columns={[
            { title: "Medicamento", dataIndex: "nome" },
            { title: "Quantidade", dataIndex: "quantidade" },
            {
              title: "Ações",
              render: (_, record) => (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removerMedicamento(record.id)}
                />
              ),
            },
          ]}
          pagination={false}
        />

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!paciente || itensPrescricao.length === 0}
          >
            Prescrever Medicamentos
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
