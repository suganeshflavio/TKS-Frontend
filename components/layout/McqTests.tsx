"use client";

import { useState } from "react";
import { Button, Card, Popconfirm, Input, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EyeOutlined, LinkOutlined, PlusOutlined, SearchOutlined, SettingOutlined } from "@ant-design/icons";
import { type TestItem, useDeleteTestMutation, useGetTestsQuery } from "@/store/features/testsApi";
import McqModal from "../modals/McqModal";
import ManageTestModal from "../modals/ManageTestModal";
import LinkToTopicModal from "../modals/LinkToTopicModal";
import TestAttemptsModal from "../modals/TestAttemptsModal";

const { Title, Text } = Typography;

export default function McqTests() {
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageTestId, setManageTestId] = useState<string | null>(null);
  const [linkTopicTest, setLinkTopicTest] = useState<TestItem | null>(null);
  const [attemptsOpen, setAttemptsOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | undefined>();
  const [selectedTestName, setSelectedTestName] = useState<string | undefined>();

  const { data, isFetching, refetch } = useGetTestsQuery({
    page,
    limit,
    search: searchText || undefined,
  });

  const [deleteTest] = useDeleteTestMutation();

  const tests = data?.tests ?? [];
  const total = data?.total ?? tests.length;

  const onDeleteTest = async (testId: string) => {
    try {
      setDeletingId(testId);
      await deleteTest(testId).unwrap();
      message.success("Test deleted successfully.");
      refetch();
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to delete test.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnsType<TestItem> = [
    {
      title: "Test Name",
      key: "testName",
      render: (_, record) => <Text strong>{record.testName ?? "-"}</Text>,
    },
    {
      title: "Topics",
      key: "topics",
      render: (_, record) => (
        <Space size={4} wrap>
          {(record.topics ?? []).length > 0
            ? record.topics!.map((topic) => <Tag key={topic.id}>{topic.name}</Tag>)
            : <Text type="secondary">-</Text>}
        </Space>
      ),
    },
    {
      title: "Questions",
      key: "questions",
      render: (_, record) => record._count?.questions ?? record.questions?.length ?? 0,
    },
    {
      title: "Attempts",
      key: "attempts",
      render: (_, record) => <Tag color="blue">{record._count?.attempts ?? 0}</Tag>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" icon={<SettingOutlined />} onClick={() => setManageTestId(record.id)}>
            Manage
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedTestId(record.id);
              setSelectedTestName(record.testName);
              setAttemptsOpen(true);
            }}
          >
            Attempts
          </Button>
          <Button size="small" icon={<LinkOutlined />} onClick={() => setLinkTopicTest(record)}>
            Link to Topic
          </Button>
          <Popconfirm
            title="Delete this test?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => onDeleteTest(record.id)}
          >
            <Button color="danger" variant="outlined" size="small" icon={<DeleteOutlined />} loading={deletingId === record.id}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {createOpen && (
        <McqModal
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          onSave={() => {
            setCreateOpen(false);
            refetch();
          }}
        />
      )}
      <ManageTestModal open={!!manageTestId} testId={manageTestId ?? undefined} onClose={() => setManageTestId(null)} />
      <LinkToTopicModal
        open={!!linkTopicTest}
        kind="mcq"
        entityId={linkTopicTest?.id}
        entityLabel={linkTopicTest?.testName}
        onClose={() => setLinkTopicTest(null)}
      />
      <TestAttemptsModal
        open={attemptsOpen}
        testId={selectedTestId}
        testName={selectedTestName}
        onCancel={() => {
          setAttemptsOpen(false);
          setSelectedTestId(undefined);
          setSelectedTestName(undefined);
        }}
      />

      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          <Space align="center" style={{ display: "flex", justifyContent: "space-between" }} wrap>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                MCQ Tests
              </Title>
              <Text type="secondary">Create tests here, then link them to a Topic in Curriculum or to a Course.</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Add Test
            </Button>
          </Space>

          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search test by name"
            value={searchText}
            onChange={(event) => {
              setPage(1);
              setSearchText(event.target.value);
            }}
          />

          <Table
            rowKey={(record) => record.id}
            columns={columns}
            dataSource={tests}
            size="small"
            loading={isFetching}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              showSizeChanger: true,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setLimit(nextPageSize);
              },
            }}
            scroll={{ x: 900 }}
          />
        </div>
      </Card>
    </>
  );
}
