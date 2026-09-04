"use client";

import { Card, Empty, Pagination, Spin, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { type EnquiryItem, useGetEnquiriesQuery } from "@/store/features/enquiriesApi";

const { Title, Text } = Typography;

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function Enquiries() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data, isFetching } = useGetEnquiriesQuery({ page, limit });

  const columns: ColumnsType<EnquiryItem> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (message: string) => <Text ellipsis={{ tooltip: message }}>{message}</Text>,
    },
    {
      title: "Received",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => formatDateTime(createdAt),
    },
  ];

  const enquiries = data?.enquiries ?? [];

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Enquiries
          </Title>
          <Text type="secondary">Review questions submitted by students and visitors.</Text>
        </div>

        {isFetching ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : enquiries.length === 0 ? (
          <Empty description="No enquiries found." />
        ) : (
            <>
          <Table<EnquiryItem>
            rowKey="id"
            columns={columns}
            dataSource={enquiries}
            pagination={false}
            scroll={{ x: 900 }}
          />
        <Pagination
          current={data?.page ?? page}
          pageSize={data?.limit ?? limit}
          total={data?.total ?? 0}
          showSizeChanger
          onChange={(nextPage, nextPageSize) => {
            setPage(nextPage);
            setLimit(nextPageSize);
          }}
        />
        </>
        )}

      </div>
    </Card>
  );
}