"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  type SubjectItem,
  useCreateSubjectMutation,
  useGetSubjectsQuery,
  usePermanentDeleteSubjectMutation,
  useUpdateSubjectMutation,
} from "@/store/features/subjectsApi";
import {
  type ClassItem,
  useCreateClassMutation,
  useGetClassesQuery,
  usePermanentDeleteClassMutation,
  useUpdateClassMutation,
} from "@/store/features/classesApi";
import {
  type ChapterItem,
  useCreateChapterMutation,
  useGetChaptersQuery,
  usePermanentDeleteChapterMutation,
  useUpdateChapterMutation,
} from "@/store/features/chaptersApi";
import {
  type TopicItem,
  useCreateTopicMutation,
  useGetTopicsQuery,
  usePermanentDeleteTopicMutation,
  useUpdateTopicMutation,
} from "@/store/features/topicsApi";
import TopicContentModal from "../modals/TopicContentModal";

const { Title, Text } = Typography;

type ApiError = {
  data?: {
    message?: string;
  };
  status?: number;
};
type EditTarget<T> = { mode: "create" } | { mode: "edit"; record: T } | null;

function ColumnCard<T extends { id: string; name: string; isActive?: boolean }>({
  title,
  emptyHint,
  items,
  loading,
  disabled,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onToggleActive,
  onDelete,
  extraAction,
}: {
  title: string;
  emptyHint: string;
  items: T[];
  loading: boolean;
  disabled?: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (record: T) => void;
  onToggleActive: (record: T) => void;
  onDelete: (record: T) => void;
  extraAction?: (record: T) => React.ReactNode;
}) {
  return (
    <Card
      size="small"
      style={{ height: "100%" }}
      title={<Text strong>{title}</Text>}
      extra={
        <Button size="small" type="primary" icon={<PlusOutlined />} disabled={disabled} onClick={onAdd}>
          Add
        </Button>
      }
    >
      {disabled ? (
        <Empty description={emptyHint} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Spin size="small" />
        </div>
      ) : items.length === 0 ? (
        <Empty description={emptyHint} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((record) => (
            <div
              key={record.id}
              onClick={() => onSelect(record.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                cursor: "pointer",
                background: selectedId === record.id ? "#e6f4ff" : undefined,
                padding: "6px 8px",
                borderRadius: 6,
              }}
            >
              <Text delete={record.isActive === false} type={record.isActive === false ? "secondary" : undefined}>
                {record.name}
              </Text>
              <Space size={0}>
                {extraAction?.(record)}
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(record);
                  }}
                />
                <Popconfirm
                  title={record.isActive === false ? "Unblock this item?" : "Block this item?"}
                  onConfirm={(event) => {
                    event?.stopPropagation();
                    onToggleActive(record);
                  }}
                  onCancel={(event) => event?.stopPropagation()}
                >
                  <Button
                    size="small"
                    type="text"
                    danger={record.isActive !== false}
                    icon={<StopOutlined />}
                    onClick={(event) => event.stopPropagation()}
                  />
                </Popconfirm>
                <Popconfirm
                  title="Delete permanently?"
                  onConfirm={(event) => {
                    event?.stopPropagation();
                    onDelete(record);
                  }}
                  onCancel={(event) => event?.stopPropagation()}
                >
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(event) => event.stopPropagation()}
                  />
                </Popconfirm>
              </Space>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function Curriculum() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const [subjectModal, setSubjectModal] = useState<EditTarget<SubjectItem>>(null);
  const [classModal, setClassModal] = useState<EditTarget<ClassItem>>(null);
  const [chapterModal, setChapterModal] = useState<EditTarget<ChapterItem>>(null);
  const [topicModal, setTopicModal] = useState<EditTarget<TopicItem>>(null);
  const [contentModalTopic, setContentModalTopic] = useState<TopicItem | null>(null);

  const [subjectForm] = Form.useForm<{ name: string }>();
  const [classForm] = Form.useForm<{ name: string }>();
  const [chapterForm] = Form.useForm<{ name: string }>();
  const [topicForm] = Form.useForm<{ name: string; order?: number }>();

  const { data: subjectsData, isFetching: isFetchingSubjects } = useGetSubjectsQuery({ limit: 200 });
  const { data: classesData, isFetching: isFetchingClasses } = useGetClassesQuery(
    selectedSubjectId ? { subjectId: selectedSubjectId, limit: 200 } : skipToken,
  );
  const { data: chaptersData, isFetching: isFetchingChapters } = useGetChaptersQuery(
    selectedClassId ? { classId: selectedClassId, limit: 200 } : skipToken,
  );
  const { data: topicsData, isFetching: isFetchingTopics } = useGetTopicsQuery(
    selectedChapterId ? { chapterId: selectedChapterId, limit: 200 } : skipToken,
  );

  const subjects = useMemo(() => subjectsData?.data ?? [], [subjectsData]);
  const classes = useMemo(() => classesData?.data ?? [], [classesData]);
  const chapters = useMemo(() => chaptersData?.data ?? [], [chaptersData]);
  const topics = useMemo(() => topicsData?.data ?? [], [topicsData]);

  const [createSubject] = useCreateSubjectMutation();
  const [updateSubject] = useUpdateSubjectMutation();
  const [deleteSubject] = usePermanentDeleteSubjectMutation();

  const [createClass] = useCreateClassMutation();
  const [updateClass] = useUpdateClassMutation();
  const [deleteClass] = usePermanentDeleteClassMutation();

  const [createChapter] = useCreateChapterMutation();
  const [updateChapter] = useUpdateChapterMutation();
  const [deleteChapter] = usePermanentDeleteChapterMutation();

  const [createTopic] = useCreateTopicMutation();
  const [updateTopic] = useUpdateTopicMutation();
  const [deleteTopic] = usePermanentDeleteTopicMutation();

  useEffect(() => {
    if (!subjectModal) {
      return;
    }
    if (subjectModal.mode === "edit") {
      subjectForm.setFieldsValue({ name: subjectModal.record.name });
    } else {
      subjectForm.resetFields();
    }
  }, [subjectForm, subjectModal]);

  useEffect(() => {
    if (!classModal) {
      return;
    }
    if (classModal.mode === "edit") {
      classForm.setFieldsValue({ name: classModal.record.name });
    } else {
      classForm.resetFields();
    }
  }, [classForm, classModal]);

  useEffect(() => {
    if (!chapterModal) {
      return;
    }
    if (chapterModal.mode === "edit") {
      chapterForm.setFieldsValue({ name: chapterModal.record.name });
    } else {
      chapterForm.resetFields();
    }
  }, [chapterForm, chapterModal]);

  useEffect(() => {
    if (!topicModal) {
      return;
    }
    if (topicModal.mode === "edit") {
      topicForm.setFieldsValue({ name: topicModal.record.name, order: topicModal.record.order });
    } else {
      topicForm.resetFields();
    }
  }, [topicForm, topicModal]);

  const handleSubjectSubmit = async (values: { name: string }) => {
    try {
      if (subjectModal?.mode === "edit") {
        await updateSubject({ id: subjectModal.record.id, body: { name: values.name.trim() } }).unwrap();
        message.success("Subject updated successfully.");
      } else {
        await createSubject({ name: values.name.trim() }).unwrap();
        message.success("Subject created successfully.");
      }
      setSubjectModal(null);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      // message.error((error as Error)?.data?.message || "Unable to save subject.");
      message.error(
        apiError.data?.message || "Unable to save subject."
      );
    }
  };

  const handleClassSubmit = async (values: { name: string }) => {
    if (!selectedSubjectId) return;
    try {
      if (classModal?.mode === "edit") {
        await updateClass({ id: classModal.record.id, body: { name: values.name.trim() } }).unwrap();
        message.success("Class updated successfully.");
      } else {
        await createClass({ name: values.name.trim(), subjectId: selectedSubjectId }).unwrap();
        message.success("Class created successfully.");
      }
      setClassModal(null);
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to save class.");
    }
  };

  const handleChapterSubmit = async (values: { name: string }) => {
    if (!selectedClassId) return;
    try {
      if (chapterModal?.mode === "edit") {
        await updateChapter({ id: chapterModal.record.id, body: { name: values.name.trim() } }).unwrap();
        message.success("Chapter updated successfully.");
      } else {
        await createChapter({ name: values.name.trim(), classId: selectedClassId }).unwrap();
        message.success("Chapter created successfully.");
      }
      setChapterModal(null);
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to save chapter.");
    }
  };

  const handleTopicSubmit = async (values: { name: string; order?: number }) => {
    if (!selectedChapterId) return;
    try {
      if (topicModal?.mode === "edit") {
        await updateTopic({
          id: topicModal.record.id,
          body: { name: values.name.trim(), order: values.order },
        }).unwrap();
        message.success("Topic updated successfully.");
      } else {
        await createTopic({ name: values.name.trim(), chapterId: selectedChapterId, order: values.order }).unwrap();
        message.success("Topic created successfully.");
      }
      setTopicModal(null);
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to save topic.");
    }
  };

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Curriculum
        </Title>
        <Text type="secondary">
          Build the Subject &rarr; Class &rarr; Chapter &rarr; Topic hierarchy. Videos, MCQ tests, and notes are
          created separately and linked to a Topic.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4" style={{ alignItems: "start" }}>
        <ColumnCard
          title="Subjects"
          emptyHint="No subjects yet."
          items={subjects}
          loading={isFetchingSubjects}
          selectedId={selectedSubjectId}
          onSelect={(id) => {
            setSelectedSubjectId(id);
            setSelectedClassId(null);
            setSelectedChapterId(null);
          }}
          onAdd={() => setSubjectModal({ mode: "create" })}
          onEdit={(record) => setSubjectModal({ mode: "edit", record })}
          onToggleActive={(record) =>
            updateSubject({ id: record.id, body: { isActive: record.isActive === false } })
              .unwrap()
              .then(() => message.success("Subject status updated."))
              .catch((error: unknown) => message.error((error as Error)?.message || "Unable to update subject."))
          }
          onDelete={(record) =>
            deleteSubject(record.id)
              .unwrap()
              .then(() => {
                message.success("Subject deleted.");
                if (selectedSubjectId === record.id) {
                  setSelectedSubjectId(null);
                  setSelectedClassId(null);
                  setSelectedChapterId(null);
                }
              })
              .catch((error: unknown) => message.error((error as Error)?.message || "Unable to delete subject."))
          }
        />

        <ColumnCard
          title="Classes"
          emptyHint={selectedSubjectId ? "No classes yet." : "Select a subject first."}
          disabled={!selectedSubjectId}
          items={classes}
          loading={isFetchingClasses}
          selectedId={selectedClassId}
          onSelect={(id) => {
            setSelectedClassId(id);
            setSelectedChapterId(null);
          }}
          onAdd={() => setClassModal({ mode: "create" })}
          onEdit={(record) => setClassModal({ mode: "edit", record })}
          onToggleActive={(record) =>
            updateClass({ id: record.id, body: { isActive: record.isActive === false } })
              .unwrap()
              .then(() => message.success("Class status updated."))
              .catch((error: unknown) => message.error((error as Error)?.message || "Unable to update class."))
          }
          onDelete={(record) =>
            deleteClass(record.id)
              .unwrap()
              .then(() => {
                message.success("Class deleted.");
                if (selectedClassId === record.id) {
                  setSelectedClassId(null);
                  setSelectedChapterId(null);
                }
              })
              .catch((error: unknown) => message.error((error as Error)?.message || "Unable to delete class."))
          }
        />

        <ColumnCard
          title="Chapters"
          emptyHint={selectedClassId ? "No chapters yet." : "Select a class first."}
          disabled={!selectedClassId}
          items={chapters}
          loading={isFetchingChapters}
          selectedId={selectedChapterId}
          onSelect={(id) => setSelectedChapterId(id)}
          onAdd={() => setChapterModal({ mode: "create" })}
          onEdit={(record) => setChapterModal({ mode: "edit", record })}
          onToggleActive={(record) =>
            updateChapter({ id: record.id, body: { isActive: record.isActive === false } })
              .unwrap()
              .then(() => message.success("Chapter status updated."))
              .catch((error: unknown) => message.error((error as Error)?.message || "Unable to update chapter."))
          }
          onDelete={(record) =>
            deleteChapter(record.id)
              .unwrap()
              .then(() => {
                message.success("Chapter deleted.");
                if (selectedChapterId === record.id) {
                  setSelectedChapterId(null);
                }
              })
              .catch((error: unknown) => message.error((error as Error)?.message || "Unable to delete chapter."))
          }
        />

        <ColumnCard
          title="Topics"
          emptyHint={selectedChapterId ? "No topics yet." : "Select a chapter first."}
          disabled={!selectedChapterId}
          items={topics}
          loading={isFetchingTopics}
          selectedId={null}
          onSelect={() => { }}
          onAdd={() => setTopicModal({ mode: "create" })}
          onEdit={(record) => setTopicModal({ mode: "edit", record })}
          onToggleActive={(record) =>
            updateTopic({ id: record.id, body: { isActive: record.isActive === false } })
              .unwrap()
              .then(() => message.success("Topic status updated."))
              .catch((error: unknown) => message.error((error as Error)?.message || "Unable to update topic."))
          }
          onDelete={(record) =>
            deleteTopic(record.id)
              .unwrap()
              .then(() => message.success("Topic deleted."))
              .catch((error: unknown) => message.error((error as Error)?.message || "Unable to delete topic."))
          }
          extraAction={(record) => (
            <Button
              key="link"
              size="small"
              type="text"
              icon={<LinkOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                setContentModalTopic(record);
              }}
            />
          )}
        />
      </div>

      {/* Subject modal */}
      <Modal
        title={subjectModal?.mode === "edit" ? "Edit Subject" : "Add Subject"}
        open={!!subjectModal}
        onCancel={() => setSubjectModal(null)}
        onOk={() => subjectForm.submit()}
        destroyOnHidden
      >
        <Form form={subjectForm} layout="vertical" requiredMark={false} onFinish={handleSubjectSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required." }]}>
            <Input placeholder="Example: Mathematics" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Class modal */}
      <Modal
        title={classModal?.mode === "edit" ? "Edit Class" : "Add Class"}
        open={!!classModal}
        onCancel={() => setClassModal(null)}
        onOk={() => classForm.submit()}
        destroyOnHidden
      >
        <Form form={classForm} layout="vertical" requiredMark={false} onFinish={handleClassSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required." }]}>
            <Input placeholder="Example: Class 10" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Chapter modal */}
      <Modal
        title={chapterModal?.mode === "edit" ? "Edit Chapter" : "Add Chapter"}
        open={!!chapterModal}
        onCancel={() => setChapterModal(null)}
        onOk={() => chapterForm.submit()}
        destroyOnHidden
      >
        <Form form={chapterForm} layout="vertical" requiredMark={false} onFinish={handleChapterSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required." }]}>
            <Input placeholder="Example: Algebra I" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Topic modal */}
      <Modal
        title={topicModal?.mode === "edit" ? "Edit Topic" : "Add Topic"}
        open={!!topicModal}
        onCancel={() => setTopicModal(null)}
        onOk={() => topicForm.submit()}
        destroyOnHidden
      >
        <Form form={topicForm} layout="vertical" requiredMark={false} onFinish={handleTopicSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required." }]}>
            <Input placeholder="Example: Quadratic Equations" />
          </Form.Item>
          <Form.Item name="order" label="Order (optional)">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <TopicContentModal
        open={!!contentModalTopic}
        topicId={contentModalTopic?.id}
        topicName={contentModalTopic?.name}
        onClose={() => setContentModalTopic(null)}
      />
    </Card>
  );
}
