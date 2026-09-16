"use client";

import React from "react";
import { ConfigProvider } from "antd";

export default function ThemeConfigProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#C88A26",
          colorPrimaryHover: "#DDA035",
          colorPrimaryActive: "#A6731B",
          colorLink: "#C88A26",
          colorLinkHover: "#DDA035",
          colorLinkActive: "#A6731B",
          colorSuccess: "#0E5C38",
          colorWarning: "#E6AC41",
          borderRadius: 8,
          fontFamily:
            "var(--font-geist-sans), Arial, -apple-system, BlinkMacSystemFont, sans-serif",
        },
        components: {
          Button: {
            colorPrimary: "#C88A26",
            colorPrimaryHover: "#DDA035",
            colorPrimaryActive: "#A6731B",
            borderRadius: 8,
          },
          Menu: {
            darkItemBg: "#06180C",
            darkSubMenuItemBg: "#041108",
            darkItemSelectedBg: "rgba(200, 138, 38, 0.22)",
            darkItemSelectedColor: "#F3D07B",
            darkItemHoverColor: "#F3D07B",
            darkItemColor: "#D1D5DB",
          },
          Layout: {
            siderBg: "#06180C",
            headerBg: "#FFFFFF",
            bodyBg: "#F4F6F4",
          },
          Tabs: {
            colorPrimary: "#C88A26",
            inkBarColor: "#C88A26",
            itemSelectedColor: "#C88A26",
            itemHoverColor: "#DDA035",
          },
          Input: {
            activeBorderColor: "#C88A26",
            hoverBorderColor: "#DDA035",
          },
          Segmented: {
            itemSelectedBg: "#FFFFFF",
            itemSelectedColor: "#C88A26",
          },
          Card: {
            borderRadiusLG: 10,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
