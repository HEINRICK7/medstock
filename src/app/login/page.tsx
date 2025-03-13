"use client";

import { useState } from "react";
import { Input, Button, Form, Card, message, App, Image } from "antd";
import { MailOutlined, LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [api, contextHolder] = message.useMessage();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    const { email, password } = values;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      api.error("Erro ao fazer login: " + error.message);
      setLoading(false);
      return;
    }

    // 🔹 Buscar dados do usuário na tabela 'usuarios'
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("id, nome, role, cargo, email")
      .eq("id", data.user?.id)
      .single();

    if (userError || !userData) {
      api.error("Erro ao obter informações do usuário.");
      setLoading(false);
      return;
    }

    // 🔹 Armazena dados do usuário no localStorage para controle de permissões
    localStorage.setItem("usuario", JSON.stringify(userData));

    api.success("Login realizado com sucesso!");

    // 🔹 Redireciona conforme o tipo de usuário
    if (userData.role === "user_postinho") {
      router.push("/pedidos");
    } else {
      router.push("/dashboard"); // Admin e outros usuários vão para a dashboard
    }

    setLoading(false);
  };

  return (
    <App>
      {contextHolder}
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F2F2F2",
          position: "relative",
        }}
      >
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/")}
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            fontSize: "16px",
          }}
        >
          Voltar para Home
        </Button>

        <Card
          style={{
            width: 800,
            padding: "32px",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            border: "1px solid #E0E0E0",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Image
              src="/assets/logo_medstock.png"
              alt="MedStock Logo"
              width={150}
              height={150}
              preview={false}
            />
          </div>

          <Form layout="vertical" onFinish={handleLogin}>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Digite seu email!" }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#8C8C8C" }} />}
                placeholder="Digite seu email"
                size="large"
                style={{ borderRadius: "6px" }}
              />
            </Form.Item>

            <Form.Item
              label="Senha"
              name="password"
              rules={[{ required: true, message: "Digite sua senha!" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#8C8C8C" }} />}
                placeholder="Digite sua senha"
                size="large"
                style={{ borderRadius: "6px" }}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: "40px",
                borderRadius: "6px",
                fontWeight: "bold",
                backgroundColor: "#1677FF",
                border: "none",
              }}
            >
              Entrar
            </Button>
          </Form>
        </Card>
      </div>
    </App>
  );
}
