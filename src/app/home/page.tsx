"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  Typography,
  Row,
  Col,
  Layout,
  Divider,
  Space,
  Avatar,
  Button,
} from "antd";
import { Hourglass, Boxes } from "lucide-react";

const { Title, Paragraph, Text } = Typography;
const { Header, Content, Footer } = Layout;

const cards = [
  {
    title: "MedStock",
    icon: Boxes,
    description: "Acesso ao painel administrativo de medicamentos e insumos",
    color: "#1677ff",
    disabled: false, // Habilitado
    redirect: "/login",
  },
  {
    title: "Ponto Digital",
    icon: Hourglass,
    description: "Gerenciamento de entrada e saída dos colaboradores",
    color: "#52c41a",
    disabled: false, // Habilitado
    redirect: "https://kzmkn1wzwdv024n5ncs8.lite.vusercontent.net/",
  },
  {
    title: "Gestão cadastros",
    icon: Boxes,
    description: "Gestão de registros e cadastros",
    color: "#722ed1",
    disabled: true, // Desativado
  },
  {
    title: "Visitas Domiciliares",
    icon: Boxes,
    description: "Controle de visitas domiciliares",
    color: "#faad14",
    disabled: true, // Desativado
  },
  {
    title: "Envio APP",
    icon: Boxes,
    description: "Envio de dados para o aplicativo",
    color: "#eb2f96",
    disabled: true, // Desativado
  },
  {
    title: "Profissionais",
    icon: Boxes,
    description: "Gestão de profissionais",
    color: "#13c2c2",
    disabled: true, // Desativado
  },
  {
    title: "Informatiza",
    icon: Boxes,
    description: "Sistema de informatização",
    color: "#fa541c",
    disabled: true, // Desativado
  },
  {
    title: "Indicadores",
    icon: Boxes,
    description: "Análise de indicadores",
    color: "#2f54eb",
    disabled: true, // Desativado
  },
];

export default function HomePage() {
  const router = useRouter();

  const handleRedirect = (redirect: string) => {
    if (redirect.startsWith("http")) {
      window.location.href = redirect; // Redireciona para URLs externas
    } else {
      router.push(redirect); // Redireciona para rotas internas
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "#0a1929",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Boxes style={{ color: "white", height: "32px", width: "32px" }} />
          <Title level={3} style={{ margin: 0, color: "white" }}>
            Administra+
          </Title>
        </div>
        <Button type="link" style={{ color: "white" }}>
          Ajuda
        </Button>
      </Header>

      <Content style={{ padding: "24px 40px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <Title level={2} style={{ margin: 0 }}>
              Selecione um Sistema
            </Title>
            <Paragraph style={{ color: "rgba(0, 0, 0, 0.45)" }}>
              Escolha um dos módulos abaixo para acessar suas funcionalidades
            </Paragraph>
            <Divider />
          </div>

          <Row gutter={[24, 24]}>
            {cards.map((card) => (
              <Col key={card.title} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable={!card.disabled}
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    opacity: card.disabled ? 0.5 : 1, // Reduz opacidade se desabilitado
                    cursor: card.disabled ? "not-allowed" : "pointer", // Muda o cursor
                  }}
                  bodyStyle={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    padding: "24px",
                  }}
                  onClick={() => !card.disabled && handleRedirect(card.redirect || "#")} // Impede clique se desabilitado
                >
                  <Avatar
                    size={64}
                    style={{
                      backgroundColor: card.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: card.disabled ? 0.5 : 1, // Aplica opacidade ao ícone
                    }}
                    icon={<card.icon size={32} color="#fff" />}
                  />
                  <div
                    style={{
                      marginTop: "16px",
                      marginBottom: "8px",
                      textAlign: "center",
                    }}
                  >
                    <Title level={4} style={{ margin: 0 }}>
                      {card.title}
                    </Title>
                  </div>
                  <Paragraph
                    type="secondary"
                    style={{ flex: 1, textAlign: "center" }}
                  >
                    {card.description}
                  </Paragraph>
                  <Button type="link" disabled={card.disabled}>
                    Acessar
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Content>

      <Footer
        style={{
          textAlign: "center",
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Text type="secondary">
          Administra+ © {new Date().getFullYear()} - Todos os direitos
          reservados
        </Text>
      </Footer>
    </Layout>
  );
}
