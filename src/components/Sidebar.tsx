"use client";

import { useState, useEffect } from "react";
import { Layout, Menu, Image, Button, Divider, Typography, Badge } from "antd";
import {
  LayoutDashboard,
  PackagePlus,
  LogOut,
  Package,
  Warehouse,
  User,
  FileText,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  List,
  FilePlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = () => {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [usuario, setUsuario] = useState<{
    nome: string;
    cargo: string;
    role: string;
  } | null>(null);
  const [pedidosPendentes, setPedidosPendentes] = useState(0);

  useEffect(() => {
    const userStorage = localStorage.getItem("usuario");
    if (userStorage) {
      setUsuario(JSON.parse(userStorage));
    }
  }, []);

  // 🔹 Buscar quantidade de pedidos pendentes
  useEffect(() => {
    const fetchPedidosPendentes = async () => {
      const { count, error } = await supabase
        .from("solicitacoes")
        .select("*", { count: "exact", head: true }) // Apenas contar os registros
        .eq("status", "Pendente"); // Filtra apenas os pedidos pendentes

      if (!error) {
        setPedidosPendentes(count || 0);
      }
    };

    fetchPedidosPendentes();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut(); // 🔹 Desloga do Supabase
    localStorage.removeItem("usuario"); // 🔹 Remove do localStorage
    router.push("/login"); // 🔹 Redireciona para login
  };

  // 🔹 Definir os menus conforme a role do usuário
  const menuItems = [
    {
      key: "dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
      onClick: () => router.push("/dashboard"),
      show: usuario?.role === "admin",
    },
    {
      key: "cadastro-produtos",
      icon: <PackagePlus size={20} />,
      label: "Cadastro de Produtos",
      onClick: () => router.push("/cadastrar-produto/cadastrar"),
      show: usuario?.role === "admin",
    },
    {
      key: "movimentacoes",
      icon: <ClipboardList size={20} />,
      label: "Movimentações",
      show: usuario?.role === "admin",
      children: [
        {
          key: "entrada",
          icon: <PackagePlus size={18} />,
          label: "Entrada",
          children: [
            {
              key: "adicionar_entrada",
              icon: <FilePlus size={16} />, // Ícone para adicionar
              label: "Adicionar",
              onClick: () => router.push("/movimentacao/entrada/adicionar"),
            },
            {
              key: "listar_entrada",
              icon: <List size={16} />, // Ícone para listar
              label: "Listar",
              onClick: () => router.push("/movimentacao/entrada/listar"),
            },
          ],
        },
        {
          key: "saida",
          icon: <Package size={18} />,
          label: "Saída",
          children: [
            {
              key: "registrar_saida",
              icon: <LogOut size={16} />, // Ícone para saída
              label: "Registrar Saída",
              onClick: () => router.push("/movimentacao/saida/registrar"),
            },
            {
              key: "listar_saida",
              icon: <List size={16} />, // Ícone para listar
              label: "Listar",
              onClick: () => router.push("/movimentacao/saida/listar"),
            },
          ],
        },
      ],
    },
    {
      key: "estoque",
      icon: <Warehouse size={20} />,
      label: "Estoque",
      onClick: () => router.push("/estoque"),
      show: usuario?.role === "admin",
    },
    {
      key: "pedidos",
      icon: <FileText size={20} />,
      label: (
        <span>
          Pedidos{" "}
          {pedidosPendentes > 0 && (
            <Badge
              count={pedidosPendentes}
              overflowCount={9}
              style={{ backgroundColor: "#f5222d", marginLeft: 8 }}
            />
          )}
        </span>
      ),
      onClick: () => router.push("/pedidos"),
      show:
        usuario?.role === "admin" ||
        usuario?.role === "user_postinho" ||
        usuario?.role === "user_farmacia",
    },
    {
      key: "solicitacoes",
      icon: <User size={20} />,
      label: "Solicitações",
      onClick: () => router.push("/solicitacoes"),
      show:
        usuario?.role === "admin" ||
        usuario?.role === "user_postinho" ||
        usuario?.role === "user_farmacia",
    },
    {
      key: "encaminhamento",
      icon: <User size={20} />,
      label: "Encaminhamento",
      onClick: () => router.push("/encaminhamento/medico"),
      show:
        usuario?.role === "admin" ||
        usuario?.role === "user_postinho" ||
        usuario?.role === "user_farmacia",
    },
    {
      key: "atendimento",
      icon: <User size={20} />,
      label: "Atendimento",
      onClick: () => router.push("/atendimento/farmacia"),
      show: usuario?.role === "admin" || usuario?.role === "user_farmacia",
    },
  ].filter((item) => item.show);
  return (
    <Sider
      theme="light"
      collapsible
      collapsed={collapsed}
      trigger={null}
      style={{
        height: "100vh",
        background: "#ffffff",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", padding: "16px" }}>
        <Image
          src="/assets/logo_medstock.png"
          alt="MedStock"
          width={collapsed ? 40 : 120}
          preview={false}
        />
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        theme="light"
        inlineCollapsed={collapsed}
        items={menuItems}
      />

      {/* Informações do Usuário */}
      <Divider style={{ margin: "12px 0" }} />
      <div
        style={{
          textAlign: "center",
          padding: "16px",
          color: "#00395f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <User size={30} />
        {!collapsed && usuario && (
          <div>
            <Text strong>{usuario.nome}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {usuario.cargo}
            </Text>
          </div>
        )}
      </div>

      {/* Logout */}
      <Menu
        mode="inline"
        theme="light"
        style={{ position: "absolute", bottom: 0, width: "100%" }}
        items={[
          {
            key: "logout",
            icon: <LogOut size={20} />,
            label: "Sair",
            danger: true,
            onClick: handleLogout,
          },
        ]}
      />

      {/* Botão de colapsar */}
      <Button
        shape="circle"
        icon={
          collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />
        }
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: "absolute",
          top: 20,
          right: -15,
          background: "#fff",
          border: "none",
          boxShadow: "0px 0px 5px rgba(0,0,0,0.2)",
        }}
      />
    </Sider>
  );
};

export default Sidebar;
