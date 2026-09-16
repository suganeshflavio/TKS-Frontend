"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Divider,
  Empty,
  Modal,
  Pagination,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useGetTestAttemptsQuery } from "@/store/features/testsApi";
import type { TestAttemptItem } from "@/store/features/testsApi";
import RichContent from "../common/RichContent";

const { Text, Title } = Typography;

interface Props {
  readonly open: boolean;
  readonly onCancel: () => void;
  readonly testId?: string;
  readonly testName?: string;
}

export default function TestAttemptsModal({
  open,
  onCancel,
  testId,
  testName,
}: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isFetching } = useGetTestAttemptsQuery(
    { id: testId ?? "", page, limit: pageSize },
    { skip: !testId || !open },
  );
  const attempts = useMemo(() => data?.attempts ?? [], [data]);
  const [selectedAttempt, setSelectedAttempt] =
    useState<TestAttemptItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [openedFor, setOpenedFor] = useState<string | undefined>(undefined);

  if (open && openedFor !== testId) {
    setOpenedFor(testId);
    setPage(1);
    setPageSize(10);
    setSelectedAttempt(null);
    setDetailOpen(false);
  } else if (!open && openedFor !== undefined) {
    setOpenedFor(undefined);
  }

  const getStudentName = (attempt: TestAttemptItem) => {
    const candidate = [
      attempt.student?.fullName,
      attempt.student?.name,
      attempt.studentName,
    ].find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );
    return candidate ?? "Unknown student";
  };
  const getStudentEmail = (attempt: TestAttemptItem) => {
    const candidate = [attempt.student?.email, attempt.studentEmail].find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );
    return candidate ?? "";
  };
  const getStatusColor = (status?: string) => {
    const normalized = status?.toLowerCase();
    if (normalized === "completed") return "green";
    if (normalized === "in_progress" || normalized === "in-progress")
      return "blue";
    return "orange";
  };

  const getScoreDisplay = (record: TestAttemptItem) => {
    const obtainedMarks = [
      record.obtainedMarks,
      record.marksObtained,
      record.score,
    ].find((value): value is number => typeof value === "number");
    const totalMarks =
      typeof record.totalMarks === "number" ? record.totalMarks : null;

    if (obtainedMarks == null) {
      return "-";
    }

    return totalMarks == null
      ? `${obtainedMarks}`
      : `${obtainedMarks}/${totalMarks}`;
  };

  const handlePageChange = (nextPage: number, nextSize?: number) => {
    if (nextSize && nextSize !== pageSize) {
      setPageSize(nextSize);
      setPage(1);
      return;
    }

    setPage(nextPage);
  };

  const columns: ColumnsType<TestAttemptItem> = [
    {
      title: "Student",
      dataIndex: "student",
      key: "student",
      render: (_value, record) => (
        <div>
          <div>{getStudentName(record)}</div>
          <Text type="secondary">{getStudentEmail(record)}</Text>
        </div>
      ),
    },
    {
      title: "Video",
      dataIndex: "video",
      key: "video",
      render: (_value, record) => <span>{record.video?.videoName || "-"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag color={getStatusColor(String(value))}>
          {String(value || "pending")}
        </Tag>
      ),
    },
    {
      title: "Score",
      dataIndex: "obtainedMarks",
      key: "score",
      render: (_value, record) => <span>{getScoreDisplay(record)}</span>,
    },
    {
      title: "Submitted",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (value) => (
        <span>{value ? new Date(String(value)).toLocaleString() : "-"}</span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_value, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSelectedAttempt(record);
            setDetailOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={testName ? `Attempts for ${testName}` : "Student Attempts"}
        open={open}
        maskClosable={false}
        onCancel={onCancel}
        footer={null}
        width={980}
        destroyOnHidden
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "100%",
          }}
        >
          {isFetching ? (
            <Text type="secondary">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 100,
                }}
              >
                <Spin />
              </div>
            </Text>
          ) : attempts.length === 0 ? (
            <Empty description="No student attempts yet." />
          ) : (
            <>
              <Table
                dataSource={attempts}
                columns={columns}
                rowKey={(record, index) => record.id ?? `attempt-${index}`}
                pagination={false}
                scroll={{ x: 1000 }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <Pagination
                  current={data?.page ?? page}
                  pageSize={data?.limit ?? pageSize}
                  total={data?.total ?? 0}
                  showSizeChanger
                  pageSizeOptions={["5", "10", "20"]}
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} of ${total} attempts`
                  }
                  onChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        title="Attempt details"
        footer={null}
        width={860}
        destroyOnHidden
      >
        {selectedAttempt ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              width: "100%",
            }}
          >
            <Title level={5} style={{ marginBottom: 0 }}>
              {testName || selectedAttempt.test?.testName || "Attempt details"}
            </Title>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Student">
                {getStudentName(selectedAttempt)}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {getStudentEmail(selectedAttempt) || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Video">
                {selectedAttempt.video?.videoName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedAttempt.status)}>
                  {selectedAttempt.status || "pending"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Questions">
                {selectedAttempt.totalQuestions ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Correct">
                {selectedAttempt.correctAnswers ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Wrong">
                {selectedAttempt.wrongAnswers ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Marks">
                {selectedAttempt.obtainedMarks ??
                  selectedAttempt.marksObtained ??
                  "-"}
                /{selectedAttempt.totalMarks ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Started">
                {selectedAttempt.startedAt
                  ? new Date(selectedAttempt.startedAt).toLocaleString()
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Submitted">
                {selectedAttempt.submittedAt
                  ? new Date(selectedAttempt.submittedAt).toLocaleString()
                  : "-"}
              </Descriptions.Item>
            </Descriptions>

            <Divider />
            <Text strong>Answers</Text>
            {selectedAttempt.answers && selectedAttempt.answers.length > 0 ? (
              <Table
                dataSource={selectedAttempt.answers}
                columns={[
                  {
                    title: "Question",
                    dataIndex: "question",
                    key: "question",
                    render: (value) => <RichContent html={value} />,
                  },
                  {
                    title: "Selected",
                    dataIndex: "selected",
                    key: "selected",
                    render: (value) => <span>{value || "-"}</span>,
                  },
                  {
                    title: "Correct",
                    dataIndex: "correctOption",
                    key: "correctOption",
                    render: (value) => <span>{value || "-"}</span>,
                  },
                  {
                    title: "Result",
                    dataIndex: "correct",
                    key: "correct",
                    render: (value) => (
                      <Tag color={value ? "green" : "red"}>
                        {value ? "Correct" : "Incorrect"}
                      </Tag>
                    ),
                  },
                ]}
                rowKey={(record, index) => record.questionId || String(index)}
                pagination={false}
                size="small"
                scroll={{ x: 1000 }}
              />
            ) : (
              <Empty description="No answer breakdown available." />
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
