"use client";

import { usePathname } from "next/navigation";
import { Layout } from "antd";
import Sidebar from "@/components/Sidebar";

const { Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 🔹 Oculta a sidebar na tela de login
  const isLoginPage = pathname === "/login" || pathname === "/";

  return (
    <html lang="pt">
      <body>
        <Layout style={{ minHeight: "100vh" }}>
          {!isLoginPage && <Sidebar />}
          <Layout style={{ flex: 1 }}>
            <Content style={{ padding: 24, backgroundColor: "#f0f2f5" }}>
              {children}
            </Content>
          </Layout>
        </Layout>
      </body>
    </html>
  );
}
