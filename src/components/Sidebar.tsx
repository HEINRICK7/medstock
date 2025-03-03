"use client";

import { useState, useEffect } from "react";
import { Layout, Menu, Image, MenuProps } from "antd";
import {
  LayoutDashboard,
  PackagePlus,
  CirclePlus,
  ClipboardList,
  LogOut,
  Package,
  Warehouse,
} from "lucide-react";
import { useRouter } from "next/navigation"; // Use useRouter do next/navigation para cliente
import { usePathname } from "next/navigation"; // Para monitorar a mudança de path
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";
const { Sider } = Layout;

const Sidebar = () => {
  const router = useRouter(); // Roteador cliente
  const pathname = usePathname(); // Obtém o caminho atual
  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>("dashboard");
  const [openKeys, setOpenKeys] = useState<string[]>([]); // Controla os menus abertos
  const screens = useBreakpoint();

  useEffect(() => {
    if (pathname) {
      setActiveKey(pathname);
    }
  }, [pathname]);
  // 🔹 Fecha os outros menus ao abrir um novo
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys.length > 0 ? [keys[keys.length - 1]] : []);
  };
  const menuItems: MenuProps["items"] = [
    {
      key: "dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
      onClick: () => router.push("/dashboard"),
    },
    {
      key: "produtos",
      label: "Produtos",
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
    {
      key: "logout",
      icon: <LogOut size={20} />,
      label: "Sair",
      danger: true,
      onClick: () => router.push("/logout"),
    },
  ];

  return (
    <>
      {/* Sidebar Desktop */}
      {screens.md && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          style={{
            height: "100vh",
            position: "relative",
            top: -104,
            left: -10,
            background: "#fff",
          }}
          collapsedWidth={0} // Sidebar fecha no mobile
        >
          <div
            style={{ height: "100vh", marginTop: "100px", background: "#fff" }}
          >
            <div className="logo" style={{ padding: 16, textAlign: "center" }}>
              <Image
                src="/assets/logo_medstock.png"
                alt="MedStock"
                width={collapsed ? 40 : 100}
              />
            </div>

            <Menu
              mode="inline"
              selectedKeys={activeKey ? [activeKey] : []}
              openKeys={openKeys} // Controlando as chaves abertas
              onOpenChange={handleOpenChange} // Controlando abertura do menu
              items={menuItems} // Passa os itens do menu para o Ant Design
            />
          </div>
        </Sider>
      )}
      {!screens.md && (
        <Sider
          collapsible
          collapsed={true}
          onCollapse={(value) => setCollapsed(value)}
          style={{
            height: "100vh",
            position: "relative",
            top: -104,
            left: -10,
            background: "#fff",
          }}
          collapsedWidth={0} // Sidebar fecha no mobile
        >
          <div style={{ height: "100vh", marginTop: "100px" }}>
            <div className="logo" style={{ padding: 16, textAlign: "center" }}>
              <Image
                src="/assets/logo_medstock.png"
                alt="MedStock"
                width={collapsed ? 40 : 100}
              />
            </div>

            <Menu
              mode="inline"
              selectedKeys={activeKey ? [activeKey] : []}
              openKeys={openKeys} // Controlando as chaves abertas
              onOpenChange={handleOpenChange} // Controlando abertura do menu
              items={menuItems} // Passa os itens do menu para o Ant Design
            />
          </div>
        </Sider>
      )}
    </>
  );
};

export default Sidebar;
