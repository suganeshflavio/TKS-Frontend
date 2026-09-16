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
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  LinkOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  type NotesItem,
  useCreateNotesMutation,
  useGetNotesByIdQuery,
  useGetNotesListQuery,
  usePermanentDeleteNotesMutation,
  useUpdateNotesMutation,
} from "@/store/features/notesApi";
import LinkToTopicModal from "../modals/LinkToTopicModal";

const { Title, Text } = Typography;

type NotesFormValues = {
  title: string;
  description?: string;
  file?: UploadFile[];
};

const MAX_FILE_SIZE_MB = 50;

const beforeUploadFile = (file: File) => {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    message.error("Only PDF files are allowed.");
    return Upload.LIST_IGNORE;
  }

  const isWithinSizeLimit = file.size / 1024 / 1024 <= MAX_FILE_SIZE_MB;

  if (!isWithinSizeLimit) {
    message.error(`File must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
    return Upload.LIST_IGNORE;
  }

  return false;
};

const pickNotesList = (payload: unknown): NotesItem[] => {
  if (Array.isArray(payload)) {
    return payload as NotesItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const directCandidates = [data.data, data.items, data.results, data.rows, data.notes];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate as NotesItem[];
    }
  }

  return [];
};

const pickTotal = (payload: unknown, fallbackLength: number) => {
  if (!payload || typeof payload !== "object") {
    return fallbackLength;
  }

  const data = payload as Record<string, unknown>;

  if (typeof data.total === "number") {
    return data.total;
  }

  return fallbackLength;
};

export default function Notes() {
  const [form] = Form.useForm<NotesFormValues>();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<"active" | "blocked">("active");
  const [linkTopicNotes, setLinkTopicNotes] = useState<NotesItem | null>(null);

  const { data, isFetching, refetch } = useGetNotesListQuery({
    page,
    limit,
    search: searchText || undefined,
  });

  const notes = useMemo(() => {
    return pickNotesList(data).filter((note) => (note.isActive !== false) === (statusTab === "active"));
  }, [data, statusTab]);

  const total = useMemo(() => pickTotal(data, notes.length), [data, notes.length]);

  const notesDetailArgs = editingId ?? skipToken;
  const { data: notesDetail, isFetching: isLoadingNotesDetail } = useGetNotesByIdQuery(notesDetailArgs);

  const [createNotes, { isLoading: isCreating }] = useCreateNotesMutation();
  const [updateNotes, { isLoading: isUpdating }] = useUpdateNotesMutation();
  const [permanentDeleteNotes] = usePermanentDeleteNotesMutation();

  useEffect(() => {
    if (!notesDetail || !editingId) {
      return;
    }

    form.setFieldsValue({
      title: notesDetail.title ?? "",
      description: notesDetail.description,
      file: notesDetail.notesUrl
        ? [
            {
              uid: "-1",
              name: notesDetail.notesFileName ?? "notes.pdf",
              status: "done",
              url: notesDetail.notesUrl,
            },
          ]
        : [],
    });
  }, [editingId, form, notesDetail]);

  const resetModal = () => {
    setOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const onSubmit = async (values: NotesFormValues) => {
    const formData = new FormData();
    formData.append("title", values.title.trim());
    if (values.description?.trim()) {
      formData.append("description", values.description.trim());
    }

    const uploadedFile = values.file?.[0]?.originFileObj;
    if (uploadedFile) {
      formData.append("file", uploadedFile);
    }

    if (!editingId && !uploadedFile) {
      message.error("Upload a PDF before saving.");
      return;
    }

    try {
      if (editingId) {
        await updateNotes({ id: editingId, body: formData }).unwrap();
        message.success("Notes updated successfully.");
      } else {
        await createNotes(formData).unwrap();
        message.success("Notes created successfully.");
      }

      resetModal();
      refetch();
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to save notes.");
    }
  };

  const onToggleBlocked = async (record: NotesItem) => {
    const nextActive = record.isActive === false;

    try {
      setStatusUpdatingId(record.id);
      await updateNotes({ id: record.id, body: { isActive: nextActive } }).unwrap();
      message.success(`Notes ${nextActive ? "unblocked" : "blocked"} successfully.`);
      refetch();
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to update notes status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const onDelete = async (record: NotesItem) => {
    try {
      setDeletingId(record.id);
      await permanentDeleteNotes(record.id).unwrap();
      message.success("Notes deleted successfully.");
      refetch();
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to delete notes.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnsType<NotesItem> = [
    {
      title: "Title",
      key: "title",
      render: (_, record) => <Text strong>{record.title}</Text>,
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
      title: "File",
      key: "file",
      render: (_, record) =>
        record.notesUrl ? (
          <a href={record.notesUrl} target="_blank" rel="noopener noreferrer">
            <Button icon={<FileTextOutlined />} size="small">
              View PDF
            </Button>
          </a>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space wrap>
          <Button icon={<LinkOutlined />} size="small" onClick={() => setLinkTopicNotes(record)}>
            Link to Topic
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
              title="Block these notes?"
              okText="Block"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: statusUpdatingId === record.id }}
              onConfirm={() => onToggleBlocked(record)}
            >
              <Button icon={<StopOutlined />} size="small" color="danger" variant="filled" loading={statusUpdatingId === record.id}>
                Block
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Unblock these notes?"
              okText="Unblock"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: statusUpdatingId === record.id }}
              onConfirm={() => onToggleBlocked(record)}
            >
              <Button icon={<CheckCircleOutlined />} color="danger" variant="filled" loading={statusUpdatingId === record.id}>
                Unblock
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete these notes?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => onDelete(record)}
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
      <LinkToTopicModal
        open={!!linkTopicNotes}
        kind="notes"
        entityId={linkTopicNotes?.id}
        entityLabel={linkTopicNotes?.title}
        onClose={() => setLinkTopicNotes(null)}
      />
      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          <Space align="center" style={{ display: "flex", justifyContent: "space-between" }} wrap>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Notes Library
              </Title>
              <Text type="secondary">
                Upload PDF notes here, then link them to a Topic in Curriculum or to a Course.
              </Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              Add Notes
            </Button>
          </Space>

          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search notes by title"
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
            dataSource={notes}
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

        <Modal
          title={editingId ? "Edit Notes" : "Add Notes"}
          open={open}
          maskClosable={false}
          onCancel={resetModal}
          onOk={() => form.submit()}
          confirmLoading={isCreating || isUpdating || isLoadingNotesDetail}
          centered
          destroyOnHidden
        >
          <Form form={form} layout="vertical" requiredMark={false} onFinish={onSubmit}>
            <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required." }]}>
              <Input placeholder="Example: Quadratics Notes" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Optional description" />
            </Form.Item>

            <Form.Item
              name="file"
              label="PDF Notes (max 50 MB)"
              valuePropName="fileList"
              getValueFromEvent={(event) => (Array.isArray(event) ? event : event?.fileList)}
            >
              <Upload accept=".pdf" maxCount={1} beforeUpload={beforeUploadFile}>
                <Button icon={<UploadOutlined />} size="small">
                  Select PDF
                </Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </>
  );
}
