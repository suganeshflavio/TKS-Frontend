"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Popconfirm,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tabs,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  type CourseItem,
  useCreateCourseMutation,
  useGetCourseByIdQuery,
  useGetCoursesQuery,
  usePermanentDeleteCourseMutation,
  useUpdateCourseMutation,
} from "@/store/features/coursesApi";
import CourseContentModal from "../modals/CourseContentModal";

const { Title, Text } = Typography;

type CourseFormValues = {
  courseName: string;
  accessType?: "free" | "paid";
  paymentType?: "full" | "emi";
  price?: number;
  strikePrice?: number;
  validityMonths?: number;
  installments?: number;
};

const pickCourseList = (payload: unknown): CourseItem[] => {
  if (Array.isArray(payload)) {
    return payload as CourseItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const directCandidates = [
    data.data,
    data.items,
    data.results,
    data.rows,
    data.courses,
  ];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate as CourseItem[];
    }
  }

  if (data.data && typeof data.data === "object") {
    const nested = data.data as Record<string, unknown>;
    const nestedCandidates = [
      nested.data,
      nested.items,
      nested.results,
      nested.rows,
      nested.courses,
    ];

    for (const candidate of nestedCandidates) {
      if (Array.isArray(candidate)) {
        return candidate as CourseItem[];
      }
    }
  }

  return [];
};

const pickTotal = (payload: unknown, fallbackLength: number) => {
  if (Array.isArray(payload)) {
    return payload.length;
  }

  if (!payload || typeof payload !== "object") {
    return fallbackLength;
  }

  const data = payload as Record<string, unknown>;

  if (typeof data.total === "number") {
    return data.total;
  }

  if (typeof data.count === "number") {
    return data.count;
  }

  if (data.data && typeof data.data === "object") {
    const nested = data.data as Record<string, unknown>;

    if (typeof nested.total === "number") {
      return nested.total;
    }

    if (typeof nested.count === "number") {
      return nested.count;
    }
  }

  return fallbackLength;
};

export default function CoursePage() {
  const [form] = Form.useForm<CourseFormValues>();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<"active" | "blocked">("active");
  const [contentModalCourse, setContentModalCourse] = useState<CourseItem | null>(null);

  const { data, isFetching, refetch } = useGetCoursesQuery({
    page,
    limit,
    search: searchText || undefined,
  });

  const courseDetailArgs = editingId ?? skipToken;
  const { data: courseDetail, isFetching: isLoadingCourseDetail } =
    useGetCourseByIdQuery(courseDetailArgs);

  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
  const [permanentDeleteCourse] = usePermanentDeleteCourseMutation();

  const courses = useMemo(() => {
    return pickCourseList(data).filter((course) => {
      const isActive = (course.isActive ?? course.IsActive) !== false;
      return isActive === (statusTab === "active");
    });
  }, [data, statusTab]);
  const total = useMemo(
    () => pickTotal(data, courses.length),
    [courses.length, data],
  );

  useEffect(() => {
    if (!courseDetail || !editingId) {
      return;
    }

    form.setFieldsValue({
      courseName:
        courseDetail.courseName ??
        courseDetail.name ??
        courseDetail.title ??
        "",
      accessType: courseDetail.accessType ?? "free",
      paymentType: courseDetail.paymentType,
      price: courseDetail.price,
      strikePrice: courseDetail.strikePrice,
      validityMonths: courseDetail.validityMonths,
      installments: courseDetail.installments,
    });
  }, [courseDetail, editingId, form]);

  const resetModal = () => {
    setOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const onSubmit = async (values: CourseFormValues) => {
    const payload = {
      courseName: values.courseName.trim(),
    };

    try {
      if (editingId) {
        await updateCourse({ courseId: editingId, body: payload }).unwrap();
        message.success("Course updated successfully.");
      } else {
        await createCourse(payload).unwrap();
        message.success("Course created successfully.");
      }

      resetModal();
      refetch();
    } catch(error:unknown) {
      message.error((error as Error)?.message || "Unable to save course.");
    }
  };

  const onToggleCourseBlocked = async (record: CourseItem) => {
    const courseId = record.id;
    const courseName = record.courseName ?? record.name ?? record.title ?? "";
    const nextActive = !((record.isActive ?? record.IsActive) !== false);

    try {
      setStatusUpdatingId(courseId);
      await updateCourse({
        courseId,
        body: {
          courseName,
          isActive: nextActive,
        },
      }).unwrap();
      message.success(`Course ${nextActive ? "unblocked" : "blocked"} successfully.`);
      refetch();
    } catch(error) {
      message.error((error as Error)?.message || "Unable to update course status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const onDeleteCourse = async (record: CourseItem) => {
    const courseId = record.id;

    try {
      setDeletingId(courseId);
      await permanentDeleteCourse(courseId).unwrap();
      message.success("Course deleted successfully.");
      refetch();
    } catch(error) {
      message.error((error as Error)?.message || "Unable to delete course.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnsType<CourseItem> = [
    {
      title: "Course",
      key: "courseName",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <Text strong>
            {record.courseName ?? record.name ?? record.title ?? "-"}
          </Text>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space wrap>
          <Button
            icon={<SettingOutlined />}
            size="small"
            onClick={() => setContentModalCourse(record)}
          >
            Manage Content
          </Button>
          <Button
            icon={<EditOutlined />}
            color="primary"
            size="small"
            variant="text"
            onClick={() => {
              setEditingId(record.id);
              setOpen(true);
            }}
          >
            Edit
          </Button>
          {statusTab === "active" ? (
            <Popconfirm
              title="Block this course?"
              okText="Block"
              cancelText="Cancel"
              okButtonProps={{danger: true, loading: statusUpdatingId === record.id }}
              onConfirm={() => onToggleCourseBlocked(record)}
            >
              <Button icon={<StopOutlined />} size="small" color="danger" variant="filled" loading={statusUpdatingId === record.id}>
                Block
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Unblock this course?"
              okText="Unblock"
              cancelText="Cancel"
              okButtonProps={{danger: true, loading: statusUpdatingId === record.id }}
              onConfirm={() => onToggleCourseBlocked(record)}
            >
              <Button icon={<CheckCircleOutlined />} size="small" color="danger" variant="filled" loading={statusUpdatingId === record.id}>
                Unblock
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete this course?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => onDeleteCourse(record)}
          >
            <Button size="small" color="danger" variant="outlined" icon={<DeleteOutlined />} loading={deletingId === record.id}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ borderRadius: 8 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
        }}
      >
        <Space
          align="center"
          style={{ display: "flex", justifyContent: "space-between" }}
          wrap
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Courses List
            </Title>
            <Text type="secondary">
              Search, paginate, create, and edit courses. Use &quot;Manage Content&quot; to link subjects, videos,
              notes, and MCQ tests.
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setOpen(true);
            }}
          >
            Add Course
          </Button>
        </Space>

        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search course by name"
          value={searchText}
          onChange={(event) => {
            setPage(1);
            setSearchText(event.target.value);
          }}
        />

        <Tabs
          activeKey={statusTab}
          onChange={(key) => {
            setStatusTab(key as "active" | "blocked");
            setPage(1);
          }}
          items={[
            { key: "active", label: "Active" },
            { key: "blocked", label: "Blocked" },
          ]}
        />

        <Table
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={courses}
          loading={isFetching}
          size="small"
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
          scroll={{ x: 700 }}
        />
      </div>

      <Modal
        title={editingId ? "Edit Course" : "Add Course"}
        open={open}
        maskClosable={false}
        onCancel={resetModal}
        onOk={() => form.submit()}
        confirmLoading={isCreating || isUpdating || isLoadingCourseDetail}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onSubmit}
        >
          <Form.Item
            name="courseName"
            label="Course Name"
            rules={[{ required: true, message: "Course name is required." }]}
          >
            <Input placeholder="Example: NEET Crash Course 2026" />
          </Form.Item>
        </Form>
      </Modal>

      <CourseContentModal
        open={!!contentModalCourse}
        courseId={contentModalCourse?.id}
        courseName={contentModalCourse?.courseName ?? contentModalCourse?.name ?? contentModalCourse?.title}
        onClose={() => setContentModalCourse(null)}
      />
    </Card>
  );
}
