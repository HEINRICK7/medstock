"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Typography,
  Tag,
  Descriptions,
  Space,
  Table,
  InputNumber,
  Divider,
  message,
  Modal,
  Steps,
} from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
  FileDoneOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  FileProtectOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import SignatureCanvas from "react-signature-canvas";

const { Title, Text } = Typography;

interface ProdutoPedido {
  id: string;
  nome_produto: string;
  apresentacao: string;
  quantidade_solicitada: number;
  quantidade_enviada?: number;
  estoque_disponivel?: number;
}

export default function PedidoDetalhes({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [api, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);
  const [produtosPedido, setProdutosPedido] = useState<ProdutoPedido[]>([]);
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
  const [assinaturaAlmoxarifado, setAssinaturaAlmoxarifado] = useState<
    string | null
  >(null);
  const [assinaturaRecebimento, setAssinaturaRecebimento] = useState<
    string | null
  >(null);

  // Modals for signatures
  const [
    modalAssinaturaRecebimentoVisivel,
    setModalAssinaturaRecebimentoVisivel,
  ] = useState(false);
  const [
    modalAssinaturaAlmoxarifadoVisivel,
    setModalAssinaturaAlmoxarifadoVisivel,
  ] = useState(false);

  // Refs for signature canvases
  const assinaturaRecebimentoRef = useRef<SignatureCanvas | null>(null);
  const assinaturaAlmoxarifadoRef = useRef<SignatureCanvas | null>(null);

  useEffect(() => {
    const userStorage = localStorage.getItem("usuario");
    if (userStorage) {
      setUsuario(JSON.parse(userStorage));
    }

    if (params.id) {
      buscarPedido(params.id);
    }
  }, [params.id]);

  async function buscarPedido(pedidoId: string) {
    setLoading(true);
    try {
      // First get basic order info
      const { data: pedidoData, error: pedidoError } = await supabase
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
        )
        .eq("id", pedidoId)
        .single();

      if (pedidoError) throw new Error(pedidoError.message);

      if (pedidoData) {
        // Set basic order data
        setDadosPedido({
          id: pedidoData.id,
          requerente: pedidoData.usuarios?.nome || "Desconhecido",
          destino: pedidoData.destino,
          data: new Date(pedidoData.created_at).toLocaleDateString("pt-BR"),
        });

        // Now get detailed order info with products
        const { data, error } = await supabase
          .from("solicitacoes")
          .select(
            `
            id,
            status,
            assinatura_requerente,
            assinatura_almoxarifado,
            assinatura_recebimento,
            nome_recebimento,
            cargo_recebimento,
            nome_almoxarifado,
            cargo_almoxarifado,
            nome_requerente,
            cargo_requerente,
            produtos_solicitados (
              id,
              quantidade,
              quantidade_enviada,
              apresentacao,
              produtos (id, nome_produto, estoque)
            )
          `
          )
          .eq("id", pedidoId)
          .single();

        if (error) throw new Error(error.message);

        setPedidoSelecionado(data);
        setAssinaturaAlmoxarifado(data.assinatura_almoxarifado || null);
        setAssinaturaRecebimento(data.assinatura_recebimento || null);

        setProdutosPedido(
          data.produtos_solicitados.map((p: any) => ({
            id: p.id,
            nome_produto: p.produtos?.nome_produto || "Desconhecido",
            apresentacao: p.apresentacao || "N/A",
            quantidade_solicitada: p.quantidade,
            quantidade_enviada: p.quantidade_enviada ?? 0,
            estoque_disponivel: p.produtos?.estoque ?? 0,
          }))
        );
      }
    } catch (error: any) {
      api.error("Erro ao buscar detalhes do pedido: " + error.message);
    } finally {
      setLoading(false);
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

  async function atualizarStatusPedido(
    novoStatus: "Aprovado" | "Reprovado" | "Recebido" | "Finalizado"
  ) {
    if (!pedidoSelecionado) return;

    let statusFinal = "Pendente";

    if (novoStatus === "Reprovado") {
      statusFinal = "Reprovado";
    } else if (novoStatus === "Finalizado") {
      statusFinal = "Finalizado";
    } else if (novoStatus === "Recebido") {
      statusFinal = "Recebido";
    } else {
      if (pedidoSelecionado.assinatura_requerente) {
        statusFinal = "Pendente";
      }

      if (
        pedidoSelecionado.assinatura_requerente &&
        pedidoSelecionado.assinatura_almoxarifado
      ) {
        statusFinal = "Aprovado";
      }

      if (
        pedidoSelecionado.assinatura_requerente &&
        pedidoSelecionado.assinatura_almoxarifado &&
        pedidoSelecionado.assinatura_recebimento
      ) {
        statusFinal = "Recebido";
      }
    }

    try {
      const { error } = await supabase
        .from("solicitacoes")
        .update({ status: statusFinal })
        .eq("id", pedidoSelecionado.id);

      if (error) {
        throw new Error(error.message);
      }

      api.success(`✅ Pedido atualizado para: ${statusFinal}`);
      buscarPedido(pedidoSelecionado.id);
    } catch (error: any) {
      api.error("Erro ao atualizar status: " + error.message);
    }
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
    buscarPedido(pedidoSelecionado.id);
    setModalAssinaturaAlmoxarifadoVisivel(false);
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
    buscarPedido(pedidoSelecionado.id);
    setModalAssinaturaRecebimentoVisivel(false);
  };

  // Função para determinar o passo atual baseado no status do pedido
  const getCurrentStep = (status: string) => {
    const statusSteps = {
      Pendente: 0,
      Aprovado: 1,
      Recebido: 2,
      Finalizado: 3,
      Reprovado: -1, // Status especial
    };
    return statusSteps[status] !== undefined ? statusSteps[status] : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-xl mb-4">Carregando detalhes do pedido...</div>
        </div>
      </div>
    );
  }
  const gerarPDF = async () => {
    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF("p", "mm", "a4");

      // Adicionar logo grande no topo centralizada
      try {
        doc.addImage(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-jozUpgJNrJy0KAEzvNBF4WJiNn7jkl.png",
          "PNG",
          70,
          2,
          70,
          50
        );
      } catch (e) {
        console.warn("Erro ao adicionar logo:", e);
      }

      // Título centralizado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("RELATÓRIO DE PEDIDO", doc.internal.pageSize.width / 2, 55, {
        align: "center",
      });

      // Informações do pedido inline abaixo do título
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Número do Pedido: ${pedidoSelecionado?.id || "N/A"}   |   Data: ${
          dadosPedido?.data || "N/A"
        }`,
        30,
        60
      );

      // Linha de separação
      doc.line(10, 65, 200, 65);

      // Informações do Pedido
      autoTable(doc, {
        startY: 70,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 11,
          halign: "center",
        },
        columnStyles: { 0: { cellWidth: "auto" } },
        head: [["Informações do Pedido"]],
        body: [
          [`Requerente: ${dadosPedido?.requerente || "N/A"}`],
          [`Destino: ${dadosPedido?.destino || "N/A"}`],
        ],
      });

      // Tabela de produtos solicitados
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 11,
          halign: "center",
        },
        bodyStyles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: "auto" },
          2: { cellWidth: "auto", halign: "center" },
          3: { cellWidth: "auto", halign: "center" },
        },
        head: [["Produto", "Apresentação", "Qtd. Solicitada", "Qtd. Enviada"]],
        body: produtosPedido.map((produto) => [
          produto.nome_produto,
          produto.apresentacao,
          produto.quantidade_solicitada.toString(),
          produto.quantidade_enviada?.toString() || "0",
        ]),
      });

      const yPos = (doc as any).lastAutoTable.finalY + 20;

      // Seção de Assinaturas
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("ASSINATURAS", doc.internal.pageSize.width / 2, yPos, {
        align: "center",
      });

      const assinaturasData = [
        [
          {
            content: "REQUERENTE",
            styles: { halign: "center", fillColor: [230, 230, 230] },
          },
          {
            content: "ALMOXARIFADO",
            styles: { halign: "center", fillColor: [230, 230, 230] },
          },
          {
            content: "RECEBIMENTO",
            styles: { halign: "center", fillColor: [230, 230, 230] },
          },
        ],
        [
          { content: "", styles: { minCellHeight: 35 } },
          { content: "", styles: { minCellHeight: 25 } },
          { content: "", styles: { minCellHeight: 25 } },
        ],
        [
          {
            content: pedidoSelecionado?.nome_requerente || "N/A",
            styles: { halign: "center" },
          },
          {
            content: pedidoSelecionado?.nome_almoxarifado || "N/A",
            styles: { halign: "center" },
          },
          {
            content: pedidoSelecionado?.nome_recebimento || "N/A",
            styles: { halign: "center" },
          },
        ],
        [
          {
            content: pedidoSelecionado?.cargo_requerente || "N/A",
            styles: { halign: "center" },
          },
          {
            content: pedidoSelecionado?.cargo_almoxarifado || "N/A",
            styles: { halign: "center" },
          },
          {
            content: pedidoSelecionado?.cargo_recebimento || "N/A",
            styles: { halign: "center" },
          },
        ],
      ];

      autoTable(doc, {
        startY: yPos + 15,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3 },
        body: assinaturasData,
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 60 },
          2: { cellWidth: 60 },
        },
      });

      // Adicionar assinaturas como imagens
      const finalY = (doc as any).lastAutoTable.finalY;
      const startY = finalY - 60; // Ajuste conforme necessário

      if (pedidoSelecionado?.assinatura_requerente) {
        try {
          doc.addImage(
            pedidoSelecionado.assinatura_requerente,
            "PNG",
            20,
            startY,
            40,
            50
          );
        } catch (e) {
          console.warn("Erro ao adicionar assinatura do requerente:", e);
        }
      }

      if (assinaturaAlmoxarifado) {
        try {
          doc.addImage(assinaturaAlmoxarifado, "PNG", 85, startY, 40, 50);
        } catch (e) {
          console.warn("Erro ao adicionar assinatura do almoxarifado:", e);
        }
      }

      if (assinaturaRecebimento) {
        try {
          doc.addImage(assinaturaRecebimento, "PNG", 150, startY, 40, 50);
        } catch (e) {
          console.warn("Erro ao adicionar assinatura de recebimento:", e);
        }
      }

      // Linha de separação antes do rodapé
      doc.line(10, 280, 200, 280);

      // Rodapé
      const dataAtual = new Date().toLocaleDateString("pt-BR");
      const horaAtual = new Date().toLocaleTimeString("pt-BR");
      doc.setFontSize(8);
      doc.text(`Documento gerado em ${dataAtual} às ${horaAtual}`, 14, 285);
      doc.text(
        `Pedido #${pedidoSelecionado?.id || "N/A"}`,
        doc.internal.pageSize.width - 80,
        285
      );

      // Abrir pré-visualização antes do download
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");

      api.success("PDF gerado e exibido com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      api.error("Erro ao gerar PDF. Tente novamente.");
    }
  };

  return (
    <div
      style={{ padding: 24, backgroundColor: "#f0f2f5", minHeight: "100vh" }}
    >
      {contextHolder}

      <div
        style={{
          display: "flex",
          marginBottom: 20,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/pedidos")}
          size="large"
        >
          Voltar para Pedidos
        </Button>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={gerarPDF}
          size="large"
        >
          Gerar PDF
        </Button>
      </div>

      {/* Status Steps - Adicionado aqui */}
      <Card
        style={{
          marginBottom: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderRadius: "8px",
        }}
        bordered={false}
      >
        <Steps
          current={getCurrentStep(pedidoSelecionado?.status || "Pendente")}
          status={
            pedidoSelecionado?.status === "Reprovado" ? "error" : "process"
          }
          items={[
            {
              title: "Pendente",
              description: "Aguardando aprovação",
              icon: <FileDoneOutlined />,
            },
            {
              title: "Aprovado",
              description: "Pedido aprovado",
              icon: <CheckCircleOutlined />,
            },
            {
              title: "Recebido",
              description: "Produtos recebidos",
              icon: <InboxOutlined />,
            },
            {
              title: "Finalizado",
              description: "Processo concluído",
              icon: <FileProtectOutlined />,
            },
          ]}
        />
        {pedidoSelecionado?.status === "Reprovado" && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Tag color="red" style={{ padding: "4px 12px", fontSize: "14px" }}>
              Este pedido foi reprovado
            </Tag>
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Title level={2}>Detalhes do Pedido</Title>

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
                  width: 260,
                  render: (value) => (
                    <Tag
                      color="blue"
                      style={{ minWidth: "60px", textAlign: "center" }}
                    >
                      {value}
                    </Tag>
                  ),
                },
                {
                  title: "Estoque Disponível",
                  dataIndex: "estoque_disponivel",
                  align: "center",
                  width: 260,
                  render: (estoque, record) => {
                    // Só renderiza esta coluna para usuários que não são user_postinho
                    if (usuario?.role === "user_postinho") {
                      return null;
                    }

                    return (
                      <Tag
                        color={estoque > 0 ? "success" : "error"}
                        style={{ minWidth: "60px", textAlign: "center" }}
                      >
                        {estoque}
                      </Tag>
                    );
                  },
                },
                {
                  title: "Quantidade Enviada",
                  dataIndex: "quantidade_enviada",
                  align: "center",
                  width: 260,
                  render: (_, record) => {
                    // Verifica se é user_postinho e se não tem assinatura do almoxarifado
                    if (
                      usuario?.role === "user_postinho" &&
                      !pedidoSelecionado?.assinatura_almoxarifado
                    ) {
                      return null; // Não mostra o campo para user_postinho sem assinatura do almoxarifado
                    }

                    // Define se o campo é editável: apenas para admin e status Pendente
                    const isEditable =
                      usuario?.role !== "user_postinho" &&
                      pedidoSelecionado?.status === "Pendente";

                    return (
                      <InputNumber
                        min={0}
                        max={record.estoque_disponivel}
                        value={record.quantidade_enviada}
                        disabled={!isEditable}
                        onChange={(value) =>
                          atualizarQuantidadeEnviada(record.id, value ?? 0)
                        }
                        style={{ width: "100%" }}
                      />
                    );
                  },
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
            {pedidoSelecionado?.assinatura_requerente && (
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
                      <Title level={4} style={{ margin: 0, color: "#595959" }}>
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
                    <Text type="secondary">Nenhuma assinatura registrada</Text>
                  )}
                  <Divider
                    style={{
                      border: "1px solid #d9d9d90",
                      margin: "8px 0",
                      width: "80%",
                    }}
                  />
                  {usuario?.role === "user_postinho" ||
                  pedidoSelecionado?.status === "Aprovado" ||
                  pedidoSelecionado?.status === "Recebido" ||
                  pedidoSelecionado?.status === "Finalizado" ? null : (
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() =>
                        setModalAssinaturaAlmoxarifadoVisivel(true)
                      }
                      size="middle"
                    >
                      Registrar Assinatura
                    </Button>
                  )}
                </div>
                {(pedidoSelecionado?.status === "Recebido" ||
                  pedidoSelecionado?.status === "Aprovado") &&
                  !assinaturaAlmoxarifado &&
                  usuario?.role !== "user_postinho" && (
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
            {(pedidoSelecionado?.status === "Aprovado" ||
              pedidoSelecionado?.status === "Recebido" ||
              pedidoSelecionado?.status === "Finalizado") && (
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
                    {(pedidoSelecionado?.status === "Aprovado" &&
                      usuario?.role === "user_postinho") ||
                      (usuario?.role === "user_farmacia" &&
                        !assinaturaRecebimento && (
                          <>
                            <Button
                              type="primary"
                              onClick={() =>
                                setModalAssinaturaRecebimentoVisivel(true)
                              }
                            >
                              Assinar Recebimento
                            </Button>
                          </>
                        ))}
                  </div>
                </div>
              </Card>
            )}
          </div>{" "}
          <div className="flex items-center gap-4">
            {usuario?.role !== "user_postinho" &&
              pedidoSelecionado?.status === "Pendente" && (
                <>
                  <Button
                    danger
                    onClick={() => atualizarStatusPedido("Reprovado")}
                    style={{ marginRight: "8px" }}
                    size="large"
                  >
                    Reprovar
                  </Button>
                  <Button
                    color="geekblue"
                    variant="outlined"
                    icon={<CheckOutlined />}
                    onClick={handleSubmitAlmoxarifado}
                    size="large"
                  >
                    Aprovar Pedido
                  </Button>
                </>
              )}

            {usuario?.role !== "user_postinho" &&
              pedidoSelecionado?.status === "Recebido" && (
                <Button
                  type="primary"
                  onClick={() => atualizarStatusPedido("Finalizado")}
                  size="large"
                >
                  Finalizar Pedido
                </Button>
              )}

            {usuario?.role === "user_postinho" ||
              (usuario?.role === "user_farmacia" &&
                pedidoSelecionado?.status === "Aprovado" && (
                  <Button
                    type="primary"
                    onClick={handleSubmitRecebimento}
                    size="large"
                  >
                    Finalizar Recebimento
                  </Button>
                ))}
          </div>
        </div>
      </Card>

      {/* Signature Modals */}
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
            gap: 20,
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
