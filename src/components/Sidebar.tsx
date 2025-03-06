import { useState, useEffect } from "react";
import { Layout, Menu, Image, Button, Divider } from "antd";
import {
  LayoutDashboard,
  PackagePlus,
  CirclePlus,
  ClipboardList,
  LogOut,
  Package,
  Warehouse,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

const { Sider } = Layout;

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>("dashboard");
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    if (pathname) {
      setActiveKey(pathname);
    }
  }, [pathname]);

  const menuItems = [
    {
      key: "dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
      onClick: () => router.push("/dashboard"),
    },
    {
      key: "entrada-produtos",
      icon: <PackagePlus size={20} />,
      label: "Entrada",
      children: [
        {
          key: "listar-produtos",
          icon: <ClipboardList size={18} />,
          label: "Listar",
          onClick: () => router.push("/entrada-produtos/listar"),
        },
        {
          key: "cadastrar-produto",
          icon: <CirclePlus size={18} />,
          label: "Cadastrar",
          onClick: () => router.push("/entrada-produtos/cadastrar"),
        },
      ],
    },
    {
      key: "saida-produtos",
      icon: <Package size={20} />,
      label: "Saída",
      children: [
        {
          key: "listar-saida_produtos",
          icon: <ClipboardList size={18} />,
          label: "Listar",
          onClick: () => router.push("/saida-produtos/listar"),
        },
        {
          key: "cadastrar-saida_produto",
          icon: <CirclePlus size={18} />,
          label: "Cadastrar",
          onClick: () => router.push("/saida-produtos/cadastrar"),
        },
      ],
    },
    {
      key: "estoque",
      icon: <Warehouse size={20} />,
      label: "Estoque",
      onClick: () => router.push("/estoque"),
    },
  ];

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
        transition: "all 0.3s ease-in-out",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Conteúdo Superior */}
      <div>
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
          selectedKeys={activeKey ? [activeKey] : []}
          openKeys={openKeys}
          onOpenChange={(keys) =>
            setOpenKeys(keys.length > 0 ? [keys[keys.length - 1]] : [])
          }
          items={menuItems}
        />
      </div>

      {/* Conteúdo Inferior */}
      <div>
        {/* Divider antes do usuário */}
        <Divider style={{margin: "12px 0" }} />

        {/* Usuário */}
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
          {!collapsed && (
            <div>
              <h3 style={{ marginBottom: 0, fontSize: "14px" }}>
                Carlos Henrique
              </h3>
              <span style={{ fontSize: 12, color: "#bbb" }}>Admin</span>
            </div>
          )}
        </div>

        {/* Botão de Logout fixado no rodapé */}
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
              onClick: () => router.push("/logout"),
            },
          ]}
        />
      </div>

      {/* Botão de Colapsar */}
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    </Sider>
  );
};

export default Sidebar;
