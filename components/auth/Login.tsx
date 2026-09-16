"use client";

import { Button, Card, Form, Input, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { useAdminLoginMutation } from "@/store/features/authApi";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { useEffect } from "react";
import Image from "next/image";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [adminLogin, { isLoading }] = useAdminLoginMutation();

  const handleLogin = async (values: { email: string; password: string }) => {
    const email = values.email?.trim();
    const password = values.password?.trim();
    const deviceId = "web";
    try {
      const response = await adminLogin({
        email,
        password,
        deviceId,
      }).unwrap();

      const token =
        response.token ?? response.accessToken ?? response.data?.token ?? response.data?.accessToken;
      const username = response.data?.user?.name;
      if (!token) {
        message.error("Login failed: token not found in response.");
        return;
      }

      dispatch(setCredentials({ token, name: username }));
      message.success("Login successful.");
      router.push("/dashboard");
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : "Invalid credentials");
    }
  };

  const adminToken = typeof window !== "undefined" ? sessionStorage.getItem("adminToken") : null;

  useEffect(() => {
    if (adminToken) {
      router.push("/dashboard");
    }
  }, [adminToken, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width:"100%",
        background: "radial-gradient(ellipse at 50% 20%, #0F3820 0%, #07190D 60%, #030C06 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 14,
          border: "1px solid rgba(200, 138, 38, 0.25)",
          borderTop: "4px solid #C88A26",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.5)",
          background: "#ffffff",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 84,
              height: 84,
              margin: "0 auto 16px",
              borderRadius: "50%",
              boxShadow: "0 8px 24px rgba(200, 138, 38, 0.3)",
              border: "2px solid rgba(200, 138, 38, 0.4)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#06180C",
            }}
          >
            <Image
              src="/tks_academy_logo.png"
              alt="TKS Academy logo"
              width={84}
              height={84}
              unoptimized
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          <Title level={3} style={{ margin: "0 0 4px", color: "#06180C", fontWeight: 700 }}>
            TKS Academy
          </Title>

          <Text type="secondary" style={{ fontSize: 13 }}>
            Admin Portal &bull; Sign in to continue
          </Text>
        </div>

        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={handleLogin}
          autoComplete="on"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Please enter your email.",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="admin@tksacademy.com"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Please enter your password.",
              },
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            type="primary"
            size="large"
            block
            htmlType="submit"
            loading={isLoading}
            style={{
              height: 48,
              fontWeight: 600,
              fontSize: 15,
              marginTop: 12,
              background: "linear-gradient(135deg, #DDA035 0%, #C88A26 100%)",
              border: "none",
              boxShadow: "0 4px 14px rgba(200, 138, 38, 0.35)",
            }}
          >
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  );
}
