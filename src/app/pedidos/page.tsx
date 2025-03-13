"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Card,
  Typography,
  message,
  Modal,
  InputNumber,
  Tag,
  Descriptions,
  Space,
  Divider,
} from "antd";
import { supabase } from "@/lib/supabase";
import {
  EyeOutlined,
  CheckOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useRouter } from "next/navigation";


const { Title, Text } = Typography;

interface Pedido {
  id: string;
  destino: string;
  status: string;
  created_at: string;
  usuario: { nome: string };
  assinatura_recebimento: string;
  assinatura_almoxarifado: string;
  assinatura_requerente: string;
  nome_requerente: string;
  cargo_requerente: string;
  nome_almoxarifado: string;
  cargo_almoxarifado: string;
  nome_recebimento: string;
  cargo_recebimento: string;
}

interface ProdutoPedido {
  id: string;
  nome_produto: string;
  apresentacao: string;
  quantidade_solicitada: number;
  quantidade_enviada?: number;
}

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtosPedido, setProdutosPedido] = useState<ProdutoPedido[]>([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [api, contextHolder] = message.useMessage();
  const [assinaturaAlmoxarifado, setAssinaturaAlmoxarifado] = useState<
    string | null
  >(null);
  const [dadosPedido, setDadosPedido] = useState<{
    id: string;
    requerente: string;
    destino: string;
    data: string;
  } | null>(null);
  const [usuario, setUsuario] = useState<{
    nome: string;
    cargo: string;
    role: string;
  } | null>(null);
  const [assinaturaRecebimento, setAssinaturaRecebimento] = useState<
    string | null
  >(null);
  const assinaturaRecebimentoRef = useRef<SignatureCanvas | null>(null);
  const [
    modalAssinaturaRecebimentoVisivel,
    setModalAssinaturaRecebimentoVisivel,
  ] = useState(false);
  const router = useRouter();
  const [
    modalAssinaturaAlmoxarifadoVisivel,
    setModalAssinaturaAlmoxarifadoVisivel,
  ] = useState(false);
  const assinaturaAlmoxarifadoRef = useRef<SignatureCanvas | null>(null);

  useEffect(() => {
    buscarPedidos();
  }, []);

  useEffect(() => {
    const userStorage = localStorage.getItem("usuario");
    if (userStorage) {
      setUsuario(JSON.parse(userStorage));
    }
  }, []);

  async function buscarPedidos() {
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
      api.error("Erro ao obter usuário logado.");
      return;
    }

    const userId = user.user.id;

    // Buscar a role do usuário
    const { data: usuarioData, error: usuarioError } = await supabase
      .from("usuarios")
      .select("role")
      .eq("id", userId)
      .single();

    if (usuarioError || !usuarioData) {
      api.error("Erro ao buscar informações do usuário.");
      return;
    }

    const userRole = usuarioData.role;

    let query = supabase
      .from("solicitacoes")
      .select(
        `
        id,
        destino,
        status,
        created_at,
        usuario_id,
        usuarios!solicitacoes_usuario_id_fkey (nome) 
      `
      ) // 🔹 Especifica a relação correta entre solicitacoes e usuarios
      .order("created_at", { ascending: false });

    if (userRole === "user_postinho") {
      query = query.eq("usuario_id", userId); // Filtra pedidos do usuário logado
    }

    const { data, error } = await query;
    console.log("📦 postinho:", data);
    if (error) {
      api.error("Erro ao buscar pedidos: " + error.message);
    } else {
      setPedidos(
        data.map((p) => ({
          id: p.id,
          destino: p.destino,
          status: p.status,
          created_at: new Date(p.created_at).toLocaleDateString("pt-BR"),
          usuario: { nome: p.usuarios?.nome || "Desconhecido" },
        }))
      );
    }
  }

  async function atualizarQuantidadeEnviada(
    produtoId: string,
    quantidade: number
  ) {
    setProdutosPedido((prev) =>
      prev.map((produto) =>
        produto.id === produtoId
          ? { ...produto, quantidade_enviada: quantidade }
          : produto
      )
    );
  }

  const handleSubmitAlmoxarifado = async () => {
    const assinaturaAlmoxarifadoBase64 =
      assinaturaAlmoxarifadoRef.current?.toDataURL("image/png");

    const payloadSolicitacao = {
      assinatura_almoxarifado: assinaturaAlmoxarifadoBase64,
      nome_almoxarifado: usuario?.nome || pedidoSelecionado?.nome_almoxarifado,
      cargo_almoxarifado:
        usuario?.cargo || pedidoSelecionado?.cargo_almoxarifado,
      status: "Aprovado",
    };

    console.log("📤 Enviando atualização da solicitação:", payloadSolicitacao);

    try {
      const { data, error } = await supabase
        .from("solicitacoes")
        .update(payloadSolicitacao)
        .eq("id", pedidoSelecionado?.id);

      if (error) {
        console.error("❌ Erro ao atualizar solicitação:", error);
        throw new Error(error.message);
      }

      console.log("✅ Solicitação atualizada com sucesso!", data);
    } catch (error: any) {
      console.error("⚠️ Erro ao atualizar solicitação:", error);
      api.error("Erro ao atualizar solicitação: " + error.message);
      return;
    }

    // Atualizando a quantidade enviada de cada produto
    for (const produto of produtosPedido) {
      const { error: updateError } = await supabase
        .from("produtos_solicitados")
        .update({ quantidade_enviada: produto.quantidade_enviada })
        .eq("id", produto.id);

      if (updateError) {
        console.error(
          `❌ Erro ao atualizar quantidade enviada do produto ${produto.nome_produto}:`,
          updateError
        );
        api.error(
          `Erro ao atualizar ${produto.nome_produto}: ${updateError.message}`
        );
      } else {
        console.log(
          `✅ Quantidade enviada de ${produto.nome_produto} atualizada!`
        );
      }
    }

    api.success("✅ Pedido atualizado com sucesso!");
    buscarPedidos();
    setModalAssinaturaAlmoxarifadoVisivel(false);
    setModalVisible(false);
  };
  const handleSubmitRecebimento = async () => {
    const assinaturaRecebimentoBase64 =
      assinaturaRecebimentoRef.current?.toDataURL("image/png");

    const payloadSolicitacao = {
      assinatura_recebimento: assinaturaRecebimentoBase64,

      nome_recebimento: usuario?.nome || pedidoSelecionado?.nome_recebimento,
      cargo_recebimento: usuario?.cargo || pedidoSelecionado?.cargo_recebimento,
      status: "Recebido",
    };

    console.log("📤 Enviando atualização da solicitação:", payloadSolicitacao);

    try {
      const { data, error } = await supabase
        .from("solicitacoes")
        .update(payloadSolicitacao)
        .eq("id", pedidoSelecionado?.id);

      if (error) {
        console.error("❌ Erro ao atualizar solicitação:", error);
        throw new Error(error.message);
      }

      console.log("✅ Solicitação atualizada com sucesso!", data);
    } catch (error: any) {
      console.error("⚠️ Erro ao atualizar solicitação:", error);
      api.error("Erro ao atualizar solicitação: " + error.message);
      return;
    }

    // Atualizando a quantidade enviada de cada produto
    for (const produto of produtosPedido) {
      const { error: updateError } = await supabase
        .from("produtos_solicitados")
        .update({ quantidade_enviada: produto.quantidade_enviada })
        .eq("id", produto.id);

      if (updateError) {
        console.error(
          `❌ Erro ao atualizar quantidade enviada do produto ${produto.nome_produto}:`,
          updateError
        );
        api.error(
          `Erro ao atualizar ${produto.nome_produto}: ${updateError.message}`
        );
      } else {
        console.log(
          `✅ Quantidade enviada de ${produto.nome_produto} atualizada!`
        );
      }
    }

    api.success("✅ Pedido atualizado com sucesso!");
    buscarPedidos();
    setModalAssinaturaAlmoxarifadoVisivel(false);
    setModalVisible(false);
  };
  async function finalizarPedido() {
    if (!pedidoSelecionado) {
      api.error("Nenhum pedido selecionado.");
      return;
    }

    if (pedidoSelecionado.status !== "Recebido") {
      api.warning(
        "O pedido precisa estar no status 'Recebido' para ser finalizado."
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("solicitacoes")
        .update({ status: "Finalizado" })
        .eq("id", pedidoSelecionado.id);

      if (error) {
        throw new Error(error.message);
      }

      api.success("✅ Pedido finalizado com sucesso!");
      buscarPedidos();
      setModalVisible(false);
    } catch (error: any) {
      api.error("Erro ao finalizar pedido: " + error.message);
    }
  }

  const getStatusColor = (status) => {
    const statusColors = {
      Pendente: "orange",
      Aprovado: "green",
      Recebido: "blue",
      Finalizado: "purple",
      Reprovado: "red",
    };
    return statusColors[status] || "default";
  };

  return (
    <div
      style={{ padding: 24, backgroundColor: "#f0f2f5", minHeight: "100vh" }}
    >
      {contextHolder}
      <Card style={{ marginBottom: 24 }}>
        <Title level={2}>Pedidos de Produtos</Title>
        <Table
          dataSource={pedidos}
          columns={[
            {
              title: "Requerente",
              dataIndex: ["usuario", "nome"],
              render: (nome) => (
                <Space>
                  <UserOutlined style={{ color: "#1890ff" }} />
                  <Text>{nome}</Text>
                </Space>
              ),
            },
            {
              title: "Destino",
              dataIndex: "destino",
              render: (destino) => (
                <Space>
                  <EnvironmentOutlined style={{ color: "#52c41a" }} />
                  <Text>{destino}</Text>
                </Space>
              ),
            },
            {
              title: "Data",
              dataIndex: "created_at",
              align: "center",
              render: (date) => (
                <Space>
                  <CalendarOutlined style={{ color: "#faad14" }} />
                  <Text>{date}</Text>
                </Space>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              align: "center",
              render: (status) => {
                let color = "blue";
                if (status === "Em Aprovação") color = "processing";
                if (status === "Recebido") color = "warning";
                if (status === "Finalizado") color = "success";
                if (status === "Reprovado") color = "error";

                return <Tag color={color}>{status}</Tag>;
              },
            },
            {
              title: "Ações",
              align: "center",
              render: (_, record) => (
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => router.push(`/pedidos/${record.id}`)}
                >
                  Visualizar
                </Button>
              ),
            },
          ]}
          rowKey="id"
          bordered={false}
        />
      </Card>

      {/* Modal de Visualização */}
      <Modal
        open={modalVisible}
        width="85%"
        style={{
          top: 20,
          maxWidth: "1200px",
          margin: "0 auto",
        }}
        onCancel={() => setModalVisible(false)}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              Detalhes do Pedido
            </Title>
            {pedidoSelecionado?.status && (
              <Tag
                color={getStatusColor(pedidoSelecionado.status)}
                style={{ fontSize: "14px", padding: "4px 12px" }}
              >
                {pedidoSelecionado.status}
              </Tag>
            )}
          </div>
        }
        footer={[
          <Button key="fechar" onClick={() => setModalVisible(false)}>
            Fechar
          </Button>,
          usuario?.role !== "user_postinho" &&
            pedidoSelecionado?.status === "Pendente" && (
              <Button
                key="aprovar"
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleSubmitAlmoxarifado}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Aprovar Pedido
              </Button>
            ),
          usuario?.role !== "user_postinho" &&
            pedidoSelecionado?.status === "Recebido" && (
              <Button key="finalizar" type="primary" onClick={finalizarPedido}>
                Finalizar Pedido
              </Button>
            ),

          usuario?.role === "user_postinho" &&
            pedidoSelecionado?.status === "Aprovado" && (
              <Button
                key="finalizar"
                type="primary"
                onClick={handleSubmitRecebimento}
              >
                Finalizar Recebimento
              </Button>
            ),
          usuario?.role !== "user_postinho" &&
            pedidoSelecionado?.status === "Pendente" && (
              <Button
                key="reprovar"
                danger
                onClick={handleSubmitAlmoxarifado}
                style={{ marginRight: 8 }}
              >
                Reprovar
              </Button>
            ),
        ]}
        bodyStyle={{
          padding: "16px 24px",
          maxHeight: "80vh",
          overflowY: "auto",
          backgroundColor: "#f5f7fa",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {dadosPedido && (
            <Card
              style={{
                marginBottom: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                borderRadius: "8px",
              }}
              bordered={false}
            >
              <Descriptions
                column={{ xs: 1, sm: 3 }}
                layout="vertical"
                bordered
                size="small"
                style={{ backgroundColor: "white" }}
              >
                <Descriptions.Item
                  label={
                    <Space>
                      <UserOutlined style={{ color: "#1890ff" }} />
                      <Text strong>Requerente</Text>
                    </Space>
                  }
                >
                  <Text>{dadosPedido.requerente}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space>
                      <EnvironmentOutlined style={{ color: "#52c41a" }} />
                      <Text strong>Destino</Text>
                    </Space>
                  }
                >
                  <Text>{dadosPedido.destino}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space>
                      <CalendarOutlined style={{ color: "#faad14" }} />
                      <Text strong>Data</Text>
                    </Space>
                  }
                >
                  <Text>{dadosPedido.data}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Card
            title={
              <Title level={5} style={{ margin: 0 }}>
                Produtos Solicitados
              </Title>
            }
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              borderRadius: "8px",
            }}
            bordered={false}
          >
            <Table
              dataSource={produtosPedido}
              columns={[
                {
                  title: "Produto",
                  dataIndex: "nome_produto",
                  ellipsis: true,
                },
                {
                  title: "Apresentação",
                  dataIndex: "apresentacao",
                  ellipsis: true,
                },
                {
                  title: "Quantidade Solicitada",
                  dataIndex: "quantidade_solicitada",
                  align: "center",
                  width: 160,
                  render: (value) => (
                    <Tag
                      color="blue"
                      style={{ minWidth: "60px", textAlign: "center" }}
                    >
                      {value}
                    </Tag>
                  ),
                },
                ...(usuario?.role !== "user_postinho"
                  ? [
                      {
                        title: "Estoque Disponível",
                        dataIndex: "estoque_disponivel",
                        align: "center",
                        width: 160,
                        render: (estoque) => (
                          <Tag
                            color={estoque > 0 ? "success" : "error"}
                            style={{ minWidth: "60px", textAlign: "center" }}
                          >
                            {estoque}
                          </Tag>
                        ),
                      },
                    ]
                  : []),
                {
                  title: "Quantidade Enviada",
                  dataIndex: "quantidade_enviada",
                  align: "center",
                  width: 160,
                  render: (_, record) => (
                    <InputNumber
                      min={0}
                      max={record.estoque_disponivel}
                      value={record.quantidade_enviada}
                      disabled={
                        pedidoSelecionado?.status === "Finalizado" ||
                        pedidoSelecionado?.status === "Reprovado" ||
                        pedidoSelecionado?.status === "Aprovado" ||
                        pedidoSelecionado?.status === "Recebido"
                      }
                      onChange={(value) =>
                        atualizarQuantidadeEnviada(record.id, value ?? 0)
                      }
                      style={{ width: "100%" }}
                    />
                  ),
                },
              ]}
              rowKey="id"
              bordered
              pagination={false}
              size="small"
              style={{ backgroundColor: "white" }}
            />
          </Card>

          {/* Signature Cards in a grid layout for better organization */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Assinatura do Requerente */}
            {pedidoSelecionado?.assinatura_requerente && (
              <Card
                title={
                  <Title level={5} style={{ margin: 0 }}>
                    Assinatura do Requerente
                  </Title>
                }
                style={{
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderRadius: "8px",
                }}
                bordered={false}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    padding: "16px",
                    backgroundColor: "#fafafa",
                    borderRadius: "4px",
                  }}
                >
                  <img
                    src={
                      pedidoSelecionado.assinatura_requerente ||
                      "/placeholder.svg"
                    }
                    alt="Assinatura do Requerente"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      border: "1px solid #f0f0f0",
                      borderRadius: 4,
                      padding: "8px",
                      backgroundColor: "white",
                    }}
                  />
                  <Divider style={{ margin: "12px 0" }} />
                  <Title level={4} style={{ margin: 0, color: "#595959" }}>
                    {pedidoSelecionado.nome_requerente === null
                      ? usuario?.nome
                      : pedidoSelecionado.nome_requerente}
                  </Title>
                  <Divider
                    style={{
                      border: "1px solid #d9d9d9",
                      margin: "8px 0",
                      width: "80%",
                    }}
                  />
                  <Text style={{ color: "#8c8c8c" }}>
                    {pedidoSelecionado.cargo_requerente === null
                      ? usuario?.cargo
                      : pedidoSelecionado.cargo_requerente}
                  </Text>
                </div>
              </Card>
            )}

            {/* Assinatura do Almoxarifado */}
            {pedidoSelecionado?.assinatura_requerente &&
              pedidoSelecionado?.assinatura_almoxarifado && (
                <Card
                  title={
                    <Title level={5} style={{ margin: 0 }}>
                      Assinatura do Almoxarifado
                    </Title>
                  }
                  style={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    borderRadius: "8px",
                  }}
                  bordered={false}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                      minHeight: 100,
                      padding: "16px",
                      backgroundColor: "#fafafa",
                      borderRadius: "4px",
                    }}
                  >
                    {assinaturaAlmoxarifado ? (
                      <>
                        <img
                          src={assinaturaAlmoxarifado || "/placeholder.svg"}
                          alt="Assinatura do almoxarifado"
                          style={{
                            maxWidth: "100%",
                            height: "auto",
                            border: "1px solid #f0f0f0",
                            borderRadius: 4,
                            padding: "8px",
                            backgroundColor: "white",
                          }}
                        />
                        <Divider style={{ margin: "12px 0" }} />
                        <Title
                          level={4}
                          style={{ margin: 0, color: "#595959" }}
                        >
                          {pedidoSelecionado.nome_almoxarifado === null
                            ? usuario?.nome
                            : pedidoSelecionado.nome_almoxarifado}
                        </Title>
                        <Divider
                          style={{
                            border: "1px solid #d9d9d9",
                            margin: "8px 0",
                            width: "80%",
                          }}
                        />
                        <Text style={{ color: "#8c8c8c" }}>
                          {pedidoSelecionado.cargo_almoxarifado === null
                            ? usuario?.cargo
                            : pedidoSelecionado.cargo_almoxarifado}
                        </Text>
                      </>
                    ) : (
                      <Text type="secondary">
                        Nenhuma assinatura registrada
                      </Text>
                    )}
                  </div>
                  {(pedidoSelecionado?.status === "Recebido" ||
                    pedidoSelecionado?.status === "Aprovado") && (
                    <div style={{ marginTop: "16px", textAlign: "center" }}>
                      <Button
                        type="primary"
                        onClick={() =>
                          setModalAssinaturaAlmoxarifadoVisivel(true)
                        }
                      >
                        Assinar
                      </Button>
                    </div>
                  )}
                </Card>
              )}

            {/* Assinatura de Recebimento */}
            {pedidoSelecionado?.status === "Recebido" && (
              <Card
                title={
                  <Title level={5} style={{ margin: 0 }}>
                    Assinatura de Recebimento
                  </Title>
                }
                style={{
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderRadius: "8px",
                }}
                bordered={false}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "16px",
                    backgroundColor: "#fafafa",
                    borderRadius: "4px",
                  }}
                >
                  {assinaturaRecebimento ? (
                    <>
                      <img
                        src={assinaturaRecebimento || "/placeholder.svg"}
                        alt="Assinatura de recebimento"
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                          border: "1px solid #f0f0f0",
                          borderRadius: 4,
                          padding: "8px",
                          backgroundColor: "white",
                        }}
                      />
                      <Divider style={{ margin: "12px 0" }} />
                      <Title level={4} style={{ margin: 0, color: "#595959" }}>
                        {pedidoSelecionado.nome_recebimento === null
                          ? usuario?.nome
                          : pedidoSelecionado.nome_recebimento}
                      </Title>
                      <Divider
                        style={{
                          border: "1px solid #d9d9d9",
                          margin: "8px 0",
                          width: "80%",
                        }}
                      />
                      <Text style={{ color: "#8c8c8c" }}>
                        {pedidoSelecionado.cargo_recebimento === null
                          ? usuario?.cargo
                          : pedidoSelecionado.cargo_recebimento}
                      </Text>
                    </>
                  ) : (
                    <Text type="secondary">Nenhuma assinatura registrada</Text>
                  )}
                  <div style={{ display: "flex", marginTop: "16px" }}>
                    {pedidoSelecionado?.status !== "Recebido" && (
                      <>
                        <Button
                          onClick={() => setAssinaturaRecebimento("")}
                          danger
                          style={{ marginRight: "8px" }}
                        >
                          Limpar
                        </Button>
                        <Button
                          type="primary"
                          onClick={() =>
                            setModalAssinaturaRecebimentoVisivel(true)
                          }
                        >
                          Assinar Recebimento
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </Modal>
      <Modal
        title="Assinar Documento - Recebimento"
        open={modalAssinaturaRecebimentoVisivel}
        onCancel={() => setModalAssinaturaRecebimentoVisivel(false)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <SignatureCanvas
            ref={assinaturaRecebimentoRef}
            penColor="black"
            canvasProps={{
              width: 1200,
              height: 500,
              className: "signatureCanvas",
              style: { border: "1px solid #d9d9d9", borderRadius: 8 },
            }}
          />
          <Space>
            <Button
              onClick={() => assinaturaRecebimentoRef.current?.clear()}
              danger
            >
              Limpar
            </Button>
            <Button
              type="default"
              onClick={() => setModalAssinaturaRecebimentoVisivel(false)}
            >
              Fechar
            </Button>
            <Button
              type="primary"
              onClick={() => {
                if (assinaturaRecebimentoRef.current) {
                  setAssinaturaRecebimento(
                    assinaturaRecebimentoRef.current.toDataURL("image/png")
                  );
                  setModalAssinaturaRecebimentoVisivel(false);
                }
              }}
            >
              Salvar Assinatura
            </Button>
          </Space>
        </div>
      </Modal>
      <Modal
        title="Assinar Documento - Almoxarifado"
        open={modalAssinaturaAlmoxarifadoVisivel}
        onCancel={() => setModalAssinaturaAlmoxarifadoVisivel(false)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <SignatureCanvas
            ref={assinaturaAlmoxarifadoRef}
            penColor="black"
            canvasProps={{
              width: 1200,
              height: 500,
              className: "signatureCanvas",
              style: { border: "1px solid #d9d9d9", borderRadius: 8 },
            }}
          />
          <Space>
            <Button
              onClick={() => assinaturaAlmoxarifadoRef.current?.clear()}
              danger
            >
              Limpar
            </Button>
            <Button
              type="primary"
              onClick={() => {
                if (assinaturaAlmoxarifadoRef.current) {
                  setAssinaturaAlmoxarifado(
                    assinaturaAlmoxarifadoRef.current.toDataURL("image/png")
                  );
                  setModalAssinaturaAlmoxarifadoVisivel(false);
                }
              }}
            >
              Salvar Assinatura
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
}
