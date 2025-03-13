"use client";

import { Layout } from "antd";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const { Content } = Layout;

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname(); // ✅ Obtém a rota atual

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* ✅ Só mostra a sidebar se a rota não for `/login` */}
      {pathname !== "/" && <Sidebar />}

      <Layout>
        <Content style={{ padding: 24, background: "#F2F2F2" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
