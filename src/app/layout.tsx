import React from "react";
import AppLayout from "@/components/Layout";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import theme from "@/theme/themeConfig";

const RootLayout = ({ children }: React.PropsWithChildren) => (
  <html lang="pt">
    <body>
      <AntdRegistry>
        <ConfigProvider theme={theme}>
          <AppLayout>{children}</AppLayout>
        </ConfigProvider>
      </AntdRegistry>
    </body>
  </html>
);

export default RootLayout;
