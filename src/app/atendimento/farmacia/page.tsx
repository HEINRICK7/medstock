"use client"

import { useState, useEffect } from "react"
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Typography,
  Divider,
  Empty,
  Spin,
  notification,
} from "antd"
import { supabase } from "@/lib/supabase"
import {
  SearchOutlined,
  CheckOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons"

const { Column } = Table
const { Title, Text } = Typography

interface ProdutoPrescricao {
  id: string
  nome_produto: string
}

interface ItemPrescricao {
  id: string
  quantidade_prescrita: number
  produtos: ProdutoPrescricao
}

interface PrescricaoDB {
  id: string
  nome_paciente: string
  created_at: string
  status: "Pendente" | "Atendida" | "Cancelada"
  itens_prescricao: ItemPrescricao[]
}


export default function FarmaciaAtendimento() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [prescricao, setPrescricao] = useState<PrescricaoDB | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)

  const [api, contextHolder] = notification.useNotification()

  // Debug logging
  useEffect(() => {
    console.log("Prescrição atual:", prescricao)
  }, [prescricao])

  const showNotification = (type: "success" | "error" | "warning", message: string, description: string) => {
    api[type]({
      message,
      description,
      placement: "topRight",
      duration: 4,
    })
  }

  // 🔍 Buscar prescrição pelo número do SUS
  async function buscarPrescricao() {
    const numeroSUS = form.getFieldValue("paciente_sus")
    if (!numeroSUS) {
      showNotification("warning", "Atenção", "Por favor, informe o número do SUS do paciente.")
      return
    }
  
    setLoading(true)
    try {
      const { data: atendidaData, error: atendidaError } = await supabase
        .from("prescricoes")
        .select("id, nome_paciente, created_at, status")
        .eq("paciente_sus", numeroSUS)
        .eq("status", "Atendida")
        .order("created_at", { ascending: false })
        .maybeSingle<PrescricaoDB>()
  
      if (atendidaData) {
        showNotification(
          "warning",
          "Prescrição já atendida",
          `A prescrição para o paciente ${atendidaData.nome_paciente} já foi atendida.`
        )
        setPrescricao(null)
        setLoading(false)
        return
      }
  
      const { data, error } = await supabase
        .from("prescricoes")
        .select(`
          id, nome_paciente, created_at, status,
          itens_prescricao ( id, quantidade_prescrita, produtos (id, nome_produto) )
        `)
        .eq("paciente_sus", numeroSUS)
        .eq("status", "Pendente")
        .order("created_at", { ascending: false })
        .maybeSingle<PrescricaoDB>()
  
      if (error || !data) {
        showNotification("error", "Prescrição não encontrada", "Nenhuma prescrição pendente foi encontrada.")
        setPrescricao(null)
      } else {
        setPrescricao({
          id: data.id,
          nome_paciente: data.nome_paciente,
          created_at: new Date(data.created_at).toLocaleDateString("pt-BR"),
          status: data.status,
          itens: data.itens_prescricao.map((item) => ({
            id: item.produtos.id,
            nome: item.produtos?.nome_produto ?? "Desconhecido",
            quantidade_prescrita: item.quantidade_prescrita,
          })),
        })
      }
    } catch (error) {
      showNotification("error", "Erro ao buscar prescrição", String(error))
      setPrescricao(null)
    } finally {
      setLoading(false)
    }
  }
  
  // Abrir modal de confirmação
  const abrirConfirmacao = () => {
    console.log("Abrindo modal de confirmação")
    showNotification("info", "Processando", "Abrindo diálogo de confirmação...")
    setConfirmModalVisible(true)
  }

  // ✅ Confirmar retirada e atualizar status no banco de dados
  async function confirmarRetirada() {
    if (!prescricao) return

    setLoading(true)
    showNotification("info", "Processando", "Confirmando retirada de medicamentos...")

    try {
      console.log("Iniciando confirmação de retirada para prescrição:", prescricao.id)

      // Atualizar status da prescrição para "Atendida"
      const { error: updateError } = await supabase
        .from("prescricoes")
        .update({ status: "Atendida" })
        .eq("id", prescricao.id)

      if (updateError) {
        console.error("Erro ao atualizar status da prescrição:", updateError)
        throw new Error(updateError.message)
      }

      console.log("Status da prescrição atualizado com sucesso")

      // Atualizar o estoque da farmácia reduzindo os medicamentos prescritos
      for (const item of prescricao.itens) {
        console.log("Atualizando estoque para produto:", item.id, "quantidade:", item.quantidade_prescrita)

        // Update the inventory
        const { error: estoqueError } = await supabase
          .from("estoque_farmacia")
          .update({
            quantidade: supabase.raw(`quantidade - ${item.quantidade_prescrita}`),
          })
          .eq("produto_id", item.id)

        if (estoqueError) {
          console.error("Erro ao atualizar estoque:", estoqueError)
          throw new Error(`Erro ao atualizar estoque: ${estoqueError.message}`)
        }
      }

      console.log("Estoque atualizado com sucesso")

      showNotification(
        "success",
        "Retirada confirmada com sucesso!",
        `Os medicamentos foram entregues ao paciente ${prescricao.nome_paciente}.`,
      )
      setPrescricao(null)
      form.resetFields()
    } catch (error: any) {
      console.error("Erro na confirmação:", error)
      showNotification("error", "Erro ao confirmar retirada", error.message)
    } finally {
      setLoading(false)
      setConfirmModalVisible(false)
    }
  }

  return (
    <div className="farmacia-container" style={{ width: "90%", margin: "20px auto", padding: "0 16px" }}>
      {contextHolder}
      <Card
        title={
          <Space>
            <MedicineBoxOutlined style={{ fontSize: 28, color: "#1890ff" }} />
            <Title level={4} style={{ margin: 0, color: "#096dd9" }}>
              Atendimento da Farmácia
            </Title>
          </Space>
        }
        bordered={false}
        style={{
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderRadius: 12,
          background: "linear-gradient(to bottom, #ffffff, #f5f5f5)",
        }}
        headStyle={{
          background: "linear-gradient(to right, #e6f7ff, #f0f5ff)",
          borderBottom: "1px solid #91caff",
          borderRadius: "12px 12px 0 0",
          padding: "16px 24px",
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="paciente_sus"
            label="Número do SUS do Paciente"
            rules={[{ required: true, message: "Informe o número do SUS." }]}
          >
            <Space.Compact style={{ width: "100%" }}>
              <Input
                placeholder="Digite o número do SUS"
                prefix={<UserOutlined />}
                size="large"
                style={{ borderRadius: "4px 0 0 4px" }}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={buscarPrescricao}
                loading={loading}
                size="large"
                style={{ borderRadius: "0 4px 4px 0" }}
              >
                Buscar
              </Button>
            </Space.Compact>
          </Form.Item>
        </Form>

        {loading && !prescricao && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Buscando prescrição...</div>
          </div>
        )}

        {!loading && !prescricao && (
          <Empty
            description="Nenhuma prescrição encontrada"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: "40px 0" }}
          />
        )}

        {prescricao && (
          <>
            <Divider orientation="left" style={{ color: "#1890ff", borderColor: "#91caff" }}>
              Informações da Prescrição
            </Divider>

            <Card
              style={{
                marginBottom: 20,
                background: "linear-gradient(to bottom, #f0f7ff, #f9f9f9)",
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(24, 144, 255, 0.1)",
                border: "1px solid #d6e4ff",
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Space align="center">
                  <UserOutlined style={{ color: "#1890ff", fontSize: 18 }} />
                  <Text strong>Paciente:</Text>
                  <Text>{prescricao.nome_paciente}</Text>
                </Space>

                <Space align="center">
                  <CalendarOutlined style={{ color: "#1890ff", fontSize: 18 }} />
                  <Text strong>Data da Prescrição:</Text>
                  <Text>{prescricao.created_at}</Text>
                </Space>

                <Space align="center">
                  <Text strong>Status:</Text>
                  <Tag
                    color={prescricao.status === "Pendente" ? "orange" : "green"}
                    style={{ padding: "2px 12px", borderRadius: 4 }}
                  >
                    {prescricao.status}
                  </Tag>
                </Space>
              </Space>
            </Card>

            <Divider orientation="left" style={{ color: "#1890ff", borderColor: "#91caff" }}>
              Medicamentos
            </Divider>

            <Table
              dataSource={prescricao.itens}
              rowKey="id"
              style={{ marginBottom: 20 }}
              pagination={false}
              bordered
              size="middle"
            >
              <Column title="Medicamento" dataIndex="nome" render={(text) => <Text strong>{text}</Text>} />
              <Column
                title="Quantidade"
                dataIndex="quantidade_prescrita"
                align="center"
                render={(value) => (
                  <Tag color="blue" style={{ padding: "2px 12px", borderRadius: 4 }}>
                    {value} unidade{value !== 1 ? "s" : ""}
                  </Tag>
                )}
              />
            </Table>

            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={abrirConfirmacao}
              loading={loading}
              style={{
                width: "100%",
                height: 50,
                fontSize: 16,
                borderRadius: 8,
                marginTop: 16,
                background:
                  prescricao.status === "Pendente" ? "linear-gradient(to right, #1890ff, #096dd9)" : "#d9d9d9",
                border: "none",
                boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
              }}
              disabled={prescricao.status !== "Pendente"}
            >
              Confirmar Retirada de Medicamentos
            </Button>
          </>
        )}
      </Card>

      {/* Modal de informações */}
      <Modal
        title={
          <Space>
            {modalContent.type === "success" && <CheckOutlined style={{ color: "#52c41a" }} />}
            {modalContent.type === "error" && <ExclamationCircleOutlined style={{ color: "#f5222d" }} />}
            {modalContent.type === "warning" && <ExclamationCircleOutlined style={{ color: "#faad14" }} />}
            <span>{modalContent.title}</span>
          </Space>
        }
        open={isModalOpen}
        onOk={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setIsModalOpen(false)}>
            OK
          </Button>,
        ]}
      >
        <p>{modalContent.message}</p>
      </Modal>

      {/* Modal de confirmação */}
      <Modal
        title="Confirmar retirada de medicamentos"
        open={confirmModalVisible}
        onOk={confirmarRetirada}
        onCancel={() => setConfirmModalVisible(false)}
        okText="Confirmar"
        cancelText="Cancelar"
        okButtonProps={{
          style: { background: "#1890ff", borderColor: "#1890ff" },
          loading: loading,
        }}
      >
        <p>Tem certeza que deseja confirmar a retirada destes medicamentos? Esta ação não pode ser desfeita.</p>
        <p>
          Paciente: <strong>{prescricao?.nome_paciente}</strong>
        </p>
        <p>
          Total de itens: <strong>{prescricao?.itens.length}</strong>
        </p>
      </Modal>
    </div>
  )
}

