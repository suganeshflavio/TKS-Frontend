"use client";

import { Card, Modal, Progress, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

type CourseInfo = {
  title: string;
  progress: number;
  access: "demo" | "paid";
  lastAccess: string;
};

type SessionRecord = {
  date: string;
  topic: string;
  duration: string;
  status: "Completed" | "Scheduled" | "Missed";
  score: string;
};

type StudentReport = {
  label: string;
  value: string;
};

export type StudentRecord = {
  key: string;
  name: string;
  email: string;
  phone: string;
  grade: string;
  enrolledCourse: string;
  status: "Active" | "Inactive" | "At Risk";
  progress: number;
  attendance: string;
  lastActive: string;
  enrollmentDate: string;
  guardian: string;
  location: string;
  availableCourses: CourseInfo[];
  sessionHistory: SessionRecord[];
  report: StudentReport[];
};

interface Props {
  readonly open: boolean;
  readonly student: StudentRecord | null;
  readonly onCancel: () => void;
}

const sessionColumns: ColumnsType<SessionRecord> = [
  {
    title: "Date",
    dataIndex: "date",
    key: "date",
  },
  {
    title: "Topic",
    dataIndex: "topic",
    key: "topic",
  },
  {
    title: "Duration",
    dataIndex: "duration",
    key: "duration",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: SessionRecord["status"]) => {
      let color: string;
      if (status === "Completed") {
        color = "green";
      } else if (status === "Scheduled") {
        color = "blue";
      } else {
        color = "orange";
      }
      return <Tag color={color}>{status}</Tag>;
    },
  },
  {
    title: "Score",
    dataIndex: "score",
    key: "score",
  },
];

const getCourseTagColor = (access: CourseInfo["access"]) =>
  access === "paid" ? "blue" : "default";

export default function StudentDetailModal({ open, student, onCancel }: Props) {
  return (
    <Modal
      title={student ? `${student.name} — Student Profile` : "Student Profile"}
      open={open}
      maskClosable={false}
      onCancel={onCancel}
      footer={null}
      width={920}
      centered
      bodyStyle={{ maxHeight: "72vh", overflowY: "auto", padding: 24 }}
    >
      {student == null ? (
        <Text>No student selected.</Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Card style={{ borderRadius: 10, padding: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div style={{ minWidth: 240 }}>
                <Title level={5}>Student Profile</Title>
                <Text strong>Name:</Text> <Text>{student.name}</Text>
                <br />
                <Text strong>Email:</Text> <Text>{student.email}</Text>
                <br />
                <Text strong>Phone:</Text> <Text>{student.phone}</Text>
              </div>
              <div style={{ minWidth: 240 }}>
                <Text strong>Grade:</Text> <Text>{student.grade}</Text>
                <br />
                <Text strong>Enrollment:</Text>{" "}
                <Text>{student.enrollmentDate}</Text>
                <br />
                <Text strong>Last Active:</Text>{" "}
                <Text>{student.lastActive}</Text>
              </div>
              <div style={{ minWidth: 240 }}>
                <Text strong>Attendance:</Text>{" "}
                <Text>{student.attendance}</Text>
                <br />
                <Text strong>Guardian:</Text> <Text>{student.guardian}</Text>
                <br />
                <Text strong>Location:</Text> <Text>{student.location}</Text>
              </div>
            </div>
          </Card>

          <Card
            title="Available Courses"
            style={{ borderRadius: 10, padding: 20 }}
          >
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {student.availableCourses.map((course) => (
                <Card
                  key={course.title}
                  size="small"
                  style={{ borderRadius: 8, width: 280, padding: 16 }}
                >
                  <Text strong>{course.title}</Text>
                  <br />
                  <Text type="secondary">Access: </Text>
                  <Tag color={getCourseTagColor(course.access)}>
                    {course.access}
                  </Tag>
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary">Progress</Text>
                    <Progress
                      percent={course.progress}
                      size="small"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <Text type="secondary">
                    Last accessed {course.lastAccess}
                  </Text>
                </Card>
              ))}
            </div>
          </Card>

          <Card
            title="Session History"
            style={{ borderRadius: 10, padding: 20 }}
          >
            <Table
              columns={sessionColumns}
              dataSource={student.sessionHistory}
              pagination={false}
              rowKey="date"
              size="small"
              scroll={{ x: true }}
            />
          </Card>

          <Card
            title="Student Report"
            style={{ borderRadius: 10, padding: 20 }}
          >
            <div style={{ display: "grid", gap: 12 }}>
              {student.report.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "#fafafa",
                  }}
                >
                  <Text>{item.label}</Text>
                  <Text strong>{item.value}</Text>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
}
