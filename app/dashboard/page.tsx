"use client";

import React, { useEffect, useState } from "react";
import {
  BookOutlined,
  CommentOutlined,
  FileTextOutlined,
  FormOutlined,
  MailOutlined,
  ReadOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  StarOutlined,
  UserOutlined,
  // CreditCardOutlined,
  VideoCameraAddOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import CoursePage from "@/components/layout/Course";
import Curriculum from "@/components/layout/Curriculum";
import Videos from "@/components/layout/Videos";
import Notes from "@/components/layout/Notes";
import McqTests from "@/components/layout/McqTests";
import Userlist from "@/components/layout/Userlist";
import Comments from "@/components/layout/Comments";
import Enquiries from "@/components/layout/Enquiries";
import Testimonials from "@/components/layout/Testimonials";
// import PaymentList from "@/components/layout/PaymentList";
import {
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
} from "antd";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { getToken } from "@/store/authStorage";
import Image from "next/image";

const { Header, Content, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  };
}

const items: MenuItem[] = [
  getItem("Content Library", "sub1", <BookOutlined />, [
    getItem("Curriculum", "1", <ReadOutlined />),
    getItem("Videos", "2", <VideoCameraAddOutlined />),
    getItem("Notes", "3", <FileTextOutlined />),
    getItem("MCQ Tests", "8", <FormOutlined />),
  ]),
  getItem("Courses", "9", <ReadOutlined />),
  getItem("User Details", "sub2", <UserOutlined />, [
    getItem("User List", "4", <UserOutlined />),
    // getItem("Payment List", "5", <CreditCardOutlined />),
  ]),
  getItem("Engagement", "sub3", <CommentOutlined />, [
    getItem("Comments", "6", <CommentOutlined />),
    getItem("Testimonials", "7", <StarOutlined />),
    getItem("Enquiries", "10", <MailOutlined />),
  ]),
];

const App: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const [collapsed, setCollapsed] = useState(false);
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const [selectedMenu, setSelectedMenu] = useState("1");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const activeToken = token ?? getToken();

    if (!activeToken) {
      router.replace("/");
    }
  }, [router, token]);
  const adminName = typeof window !== "undefined" ? sessionStorage.getItem("adminName") : null;

  const isMobile = !screens.lg;
  const renderContent = () => {
    switch (selectedMenu) {
      case "1":
        return <Curriculum />;

      case "2":
        return <Videos />;

      case "3":
        return <Notes />;

      case "8":
        return <McqTests />;

      case "9":
        return <CoursePage />;

      case "4":
        return <Userlist />;

      case "6":
        return <Comments />;

      case "7":
        return <Testimonials />;

      case "10":
        return <Enquiries />;

      default:
        return <Curriculum />;
    }
  };
  const userMenu = {
    items: [
      {
        key: "1",
        label: "Profile",
        disabled: true,
      },
      {
        key: "2",
        label: "Logout",
        danger: true,
        disabled: false,
      },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === "2") {
        dispatch(logout());
        router.replace("/");
      }
    },
  };

  const SidebarContent = (
    <>
      <div
        style={{
          height: 88,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          borderBottom: "1px solid rgba(200, 138, 38, 0.2)",
          background: "linear-gradient(180deg, #092414 0%, #06180C 100%)",
        }}
      >
        <Image
          src="/tks_academy_logo.png"
          alt="TKS Academy logo"
          width={collapsed ? 44 : 64}
          height={collapsed ? 44 : 64}
          preload
          unoptimized
          style={{
            borderRadius: "50%",
            border: "2px solid rgba(200, 138, 38, 0.4)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            transition: "all 0.3s ease",
          }}
        />
      </div>

      <Menu
        theme="dark"
        defaultSelectedKeys={["1"]}
        mode="inline"
        items={items}
        selectedKeys={[selectedMenu]}
        style={{
          background: "#06180C",
          border: "none",
          padding: "12px 6px",
        }}
        onClick={({ key }) => setSelectedMenu(key)}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            background: "#06180C",
            borderRight: "1px solid rgba(200, 138, 38, 0.15)",
          }}
        >
          {SidebarContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          styles={{
            body: { background: "#06180C", padding: 0 },
            header: {
              background: "#06180C",
              borderBottom: "1px solid rgba(200, 138, 38, 0.2)",
            },
          }}
        >
          <div
            style={{
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              borderBottom: "1px solid rgba(200, 138, 38, 0.2)",
            }}
          >
            <Image
              src="/tks_academy_logo.png"
              alt="TKS Academy logo"
              width={56}
              height={56}
              unoptimized
              style={{
                borderRadius: "50%",
                border: "2px solid rgba(200, 138, 38, 0.4)",
              }}
            />
          </div>
          <Menu
            theme="dark"
            mode="inline"
            items={items}
            selectedKeys={[selectedMenu]}
            style={{ background: "#06180C", border: "none", padding: "12px 6px" }}
            onClick={({ key }) => {
              setSelectedMenu(key);
              setMobileOpen(false);
            }}
          />
        </Drawer>
      )}

      <Layout>
        {/* Header */}
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Left Side */}
          <div>
            {isMobile && (
              <Button
                type="text"
                icon={
                  mobileOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />
                }
                onClick={() => setMobileOpen(!mobileOpen)}
              />
            )}
          </div>

          {/* Right Side */}
          <Dropdown menu={userMenu} trigger={["click"]}>
            <div
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Avatar
                icon={<UserOutlined />}
                style={{
                  backgroundColor: "#06180C",
                  color: "#DDA035",
                  border: "1px solid rgba(200, 138, 38, 0.4)",
                }}
              />

              {!isMobile && (
                <span style={{ fontWeight: 500, color: "#1F2937" }}>
                  {adminName ?? "Admin"}
                </span>
              )}
            </div>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              minHeight: 630,
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
            }}
          >
            {/* Content Here */}
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
