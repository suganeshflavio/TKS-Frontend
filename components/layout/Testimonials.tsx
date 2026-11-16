"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Rate,
  Space,
  Table,
  Tabs,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, StopOutlined } from "@ant-design/icons";
import {
  type TestimonialItem,
  useDeleteTestimonialMutation,
  useGetTestimonialsQuery,
  useUpdateTestimonialMutation,
} from "@/store/features/testimonialsApi";
import { getErrorMessage } from "@/utils/error";

const { Title, Text } = Typography;

type TestimonialFormValues = {
  star: number;
  review: string;
};

const pickTestimonialList = (payload: unknown): TestimonialItem[] => {
  if (Array.isArray(payload)) {
    return payload as TestimonialItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const directCandidates = [data.data, data.items, data.results, data.rows, data.testimonials];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate as TestimonialItem[];
    }
  }

  if (data.data && typeof data.data === "object") {
    const nested = data.data as Record<string, unknown>;
    const nestedCandidates = [nested.data, nested.items, nested.results, nested.rows, nested.testimonials];

    for (const candidate of nestedCandidates) {
      if (Array.isArray(candidate)) {
        return candidate as TestimonialItem[];
      }
    }
  }

  return [];
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function Testimonials() {
  const [form] = Form.useForm<TestimonialFormValues>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<"active" | "blocked">("active");

  const { data, isFetching } = useGetTestimonialsQuery();
  const [updateTestimonial, { isLoading: isUpdating }] = useUpdateTestimonialMutation();
  const [deleteTestimonial] = useDeleteTestimonialMutation();

  const testimonials = useMemo(() => {
    return pickTestimonialList(data).filter((testimonial) => {
      const isActive = testimonial.isActive !== false;
      return isActive === (statusTab === "active");
    });
  }, [data, statusTab]);

  const editingTestimonial = useMemo(
    () => pickTestimonialList(data).find((testimonial) => testimonial.id === editingId) ?? null,
    [data, editingId],
  );

  useEffect(() => {
    if (!editingTestimonial) {
      return;
    }

    form.setFieldsValue({
      star: editingTestimonial.star,
      review: editingTestimonial.review,
    });
  }, [editingTestimonial, form]);

  const resetModal = () => {
    setOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const onSubmit = async (values: TestimonialFormValues) => {
    if (!editingId) {
      return;
    }

    try {
      await updateTestimonial({
        id: editingId,
        body: { star: values.star, review: values.review.trim() },
      }).unwrap();
      message.success("Testimonial updated successfully.");
      resetModal();
    } catch (error: unknown) {
      message.error(getErrorMessage(error, "Unable to update testimonial."));
    }
  };

  const onToggleTestimonialBlocked = async (record: TestimonialItem) => {
    const nextActive = !(record.isActive !== false);

    try {
      setStatusUpdatingId(record.id);
      await updateTestimonial({ id: record.id, body: { isActive: nextActive } }).unwrap();
      message.success(`Testimonial ${nextActive ? "unblocked" : "blocked"} successfully.`);
    } catch (error: unknown) {
      message.error(getErrorMessage(error, "Unable to update testimonial status."));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const onDeleteTestimonial = async (record: TestimonialItem) => {
    try {
      setDeletingId(record.id);
      await deleteTestimonial(record.id).unwrap();
      message.success("Testimonial deleted successfully.");
    } catch (error: unknown) {
      message.error(getErrorMessage(error, "Unable to delete testimonial."));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnsType<TestimonialItem> = [
    {
      title: "Student",
      key: "username",
      render: (_, record) => <Text strong>{record.username}</Text>,
    },
    {
      title: "Rating",
      key: "star",
      render: (_, record) => <Rate disabled value={record.star} />,
    },
    {
      title: "Review",
      key: "review",
      render: (_, record) => (
        <Text style={{ maxWidth: 320 }} ellipsis={{ tooltip: record.review }}>
          {record.review}
        </Text>
      ),
    },
    {
      title: "Submitted",
      key: "createdAt",
      render: (_, record) => formatDateTime(record.createdAt),
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Space wrap>
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
              title="Hide this testimonial?"
              okText="Hide"
              cancelText="Cancel"
              okButtonProps={{danger: true, loading: statusUpdatingId === record.id }}
              onConfirm={() => onToggleTestimonialBlocked(record)}
            >
              <Button icon={<StopOutlined />} size="small" color="danger" variant="filled" loading={statusUpdatingId === record.id}>
                Hide
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Unhide this testimonial?"
              okText="Unhide"
              cancelText="Cancel"
              okButtonProps={{danger: true, loading: statusUpdatingId === record.id }}
              onConfirm={() => onToggleTestimonialBlocked(record)}
            >
              <Button icon={<CheckCircleOutlined />} size="small" color="danger" variant="filled" loading={statusUpdatingId === record.id}>
                Unhide
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete this testimonial?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => onDeleteTestimonial(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} loading={deletingId === record.id}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Testimonials
          </Title>
          <Text type="secondary">Review, edit, and moderate student testimonials.</Text>
        </div>

        <Tabs
          activeKey={statusTab}
          onChange={(key) => setStatusTab(key as "active" | "blocked")}
          items={[
            { key: "active", label: "Active List" },
            { key: "blocked", label: "InActive List" },
          ]}
        />

        <Table
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={testimonials}
          size="small"
          loading={isFetching}
          scroll={{ x: 900 }}
        />
      </div>

      <Modal
        title="Edit Testimonial"
        open={open}
        onCancel={resetModal}
        onOk={() => form.submit()}
        confirmLoading={isUpdating}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false} onFinish={onSubmit}>
          <Form.Item name="star" label="Rating" rules={[{ required: true, message: "Rating is required." }]}>
            <Rate />
          </Form.Item>

          <Form.Item name="review" label="Review" rules={[{ required: true, message: "Review is required." }]}>
            <Input.TextArea rows={4} placeholder="Review text" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
