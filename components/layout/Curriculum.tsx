"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Collapse,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Spin,
  Tag,
  Tooltip,
  Tree,
  Typography,
  message,
} from "antd";
import type { TreeDataNode } from "antd";
import {
  ApartmentOutlined,
  BarsOutlined,
  BookOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderOutlined,
  FormOutlined,
  LinkOutlined,
  PlusOutlined,
  ReadOutlined,
  SearchOutlined,
  StopOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
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
  useLazyGetClassesQuery,
  usePermanentDeleteClassMutation,
  useUpdateClassMutation,
} from "@/store/features/classesApi";
import {
  type ChapterItem,
  useCreateChapterMutation,
  useGetChaptersQuery,
  useLazyGetChaptersQuery,
  usePermanentDeleteChapterMutation,
  useUpdateChapterMutation,
} from "@/store/features/chaptersApi";
import {
  type TopicItem,
  useCreateTopicMutation,
  useGetTopicsQuery,
  useLazyGetTopicsQuery,
  usePermanentDeleteTopicMutation,
  useUpdateTopicMutation,
} from "@/store/features/topicsApi";
import TopicContentModal from "../modals/TopicContentModal";

const { Title, Text } = Typography;

type ApiError = {
  data?: {
    message?: string;
  };
  message?: string;
};

type SubjectModalState =
  | { mode: "create" }
  | { mode: "edit"; record: SubjectItem }
  | null;

type ClassModalState =
  | { mode: "create"; subjectId: string; subjectName?: string }
  | { mode: "edit"; record: ClassItem }
  | null;

type ChapterModalState =
  | { mode: "create"; classId: string; className?: string; subjectName?: string }
  | { mode: "edit"; record: ChapterItem }
  | null;

type TopicModalState =
  | { mode: "create"; chapterId: string; chapterName?: string }
  | { mode: "edit"; record: TopicItem }
  | null;

// ==========================================
// Level 4: Chapter Topics Component
// ==========================================
function ChapterTopicSection({
  chapter,
  statusFilter,
  onAddTopic,
  onEditTopic,
  onToggleActive,
  onDeleteTopic,
  onManageContent,
}: {
  chapter: ChapterItem;
  statusFilter: "all" | "active" | "blocked";
  onAddTopic: (chapter: ChapterItem) => void;
  onEditTopic: (topic: TopicItem) => void;
  onToggleActive: (topic: TopicItem) => void;
  onDeleteTopic: (topic: TopicItem) => void;
  onManageContent: (topic: TopicItem) => void;
}) {
  const { data: topicsData, isFetching } = useGetTopicsQuery({
    chapterId: chapter.id,
    limit: 200,
  });

  const rawTopics = useMemo(() => topicsData?.data ?? [], [topicsData]);
  const topics = useMemo(() => {
    return rawTopics.filter((t) => {
      if (statusFilter === "active") return t.isActive !== false;
      if (statusFilter === "blocked") return t.isActive === false;
      return true;
    });
  }, [rawTopics, statusFilter]);

  if (isFetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
        <Spin size="small" />
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          background: "#fafafa",
          borderRadius: 6,
          border: "1px dashed #d9d9d9",
          textAlign: "center",
          margin: "4px 0",
        }}
      >
        <Text type="secondary">
          {rawTopics.length === 0
            ? `No topics created in "${chapter.name}" yet.`
            : `No topics match the current status filter.`}
        </Text>
        <div style={{ marginTop: 8 }}>
          <Button
            size="small"
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => onAddTopic(chapter)}
          >
            Add Topic to this Chapter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {topics.map((topic, index) => {
        const videoCount = topic._count?.videos ?? topic.videos?.length ?? 0;
        const notesCount = topic._count?.notes ?? topic.notes?.length ?? 0;
        const testCount = topic._count?.mcqTests ?? topic.mcqTests?.length ?? 0;
        const isBlocked = topic.isActive === false;

        return (
          <div
            key={topic.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              background: isBlocked ? "#fff1f0" : "#ffffff",
              border: `1px solid ${isBlocked ? "#ffccc7" : "#f0f0f0"}`,
              borderRadius: 6,
              transition: "all 0.2s ease",
            }}
          >
            {/* Topic Info */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <Tag color={isBlocked ? "default" : "blue"} style={{ margin: 0, fontWeight: 600 }}>
                #{topic.order ?? index + 1}
              </Tag>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: isBlocked ? "#8c8c8c" : "#1f1f1f",
                    textDecoration: isBlocked ? "line-through" : "none",
                    wordBreak: "break-word",
                  }}
                >
                  {topic.name}
                </span>
              </div>

              {/* Linked content count tags */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {videoCount > 0 ? (
                  <Tag icon={<VideoCameraOutlined />} color="cyan">
                    {videoCount} {videoCount === 1 ? "Video" : "Videos"}
                  </Tag>
                ) : null}
                {notesCount > 0 ? (
                  <Tag icon={<FileTextOutlined />} color="purple">
                    {notesCount} {notesCount === 1 ? "Note" : "Notes"}
                  </Tag>
                ) : null}
                {testCount > 0 ? (
                  <Tag icon={<FormOutlined />} color="gold">
                    {testCount} {testCount === 1 ? "Test" : "Tests"}
                  </Tag>
                ) : null}
                {videoCount === 0 && notesCount === 0 && testCount === 0 ? (
                  <Tag color="default">No linked content</Tag>
                ) : null}
              </div>
            </div>

            {/* Actions */}
            <Space size={4} style={{ marginLeft: 12 }}>
              <Tooltip title="Link Videos, Notes & MCQ Tests to this topic">
                <Button
                  size="small"
                  type="primary"
                  ghost
                  icon={<LinkOutlined />}
                  onClick={() => onManageContent(topic)}
                >
                  Manage Content
                </Button>
              </Tooltip>

              <Tooltip title="Edit Topic">
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => onEditTopic(topic)}
                />
              </Tooltip>

              <Popconfirm
                title={isBlocked ? "Unblock this topic?" : "Block this topic?"}
                okText={isBlocked ? "Unblock" : "Block"}
                cancelText="Cancel"
                okButtonProps={{ danger: !isBlocked }}
                onConfirm={() => onToggleActive(topic)}
              >
                <Tooltip title={isBlocked ? "Unblock Topic" : "Block Topic"}>
                  <Button
                    size="small"
                    type="text"
                    danger={!isBlocked}
                    icon={isBlocked ? <CheckCircleOutlined /> : <StopOutlined />}
                  />
                </Tooltip>
              </Popconfirm>

              <Popconfirm
                title="Delete topic permanently?"
                description="This will unlink all associated videos, tests, and notes."
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                onConfirm={() => onDeleteTopic(topic)}
              >
                <Tooltip title="Delete Topic">
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </Space>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// Level 3: Class Chapters Component
// ==========================================
function ClassChapterSection({
  classItem,
  subjectName,
  statusFilter,
  searchQuery,
  onAddChapter,
  onEditChapter,
  onToggleActive,
  onDeleteChapter,
  onAddTopic,
  onEditTopic,
  onToggleTopicActive,
  onDeleteTopic,
  onManageContent,
}: {
  classItem: ClassItem;
  subjectName?: string;
  statusFilter: "all" | "active" | "blocked";
  searchQuery: string;
  onAddChapter: (classItem: ClassItem, subjectName?: string) => void;
  onEditChapter: (chapter: ChapterItem) => void;
  onToggleActive: (chapter: ChapterItem) => void;
  onDeleteChapter: (chapter: ChapterItem) => void;
  onAddTopic: (chapter: ChapterItem) => void;
  onEditTopic: (topic: TopicItem) => void;
  onToggleTopicActive: (topic: TopicItem) => void;
  onDeleteTopic: (topic: TopicItem) => void;
  onManageContent: (topic: TopicItem) => void;
}) {
  const { data: chaptersData, isFetching } = useGetChaptersQuery({
    classId: classItem.id,
    limit: 200,
  });

  const rawChapters = useMemo(() => chaptersData?.data ?? [], [chaptersData]);
  const chapters = useMemo(() => {
    return rawChapters.filter((c) => {
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive !== false) ||
        (statusFilter === "blocked" && c.isActive === false);
      const matchSearch =
        !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [rawChapters, statusFilter, searchQuery]);

  if (isFetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
        <Spin size="small" />
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          background: "#ffffff",
          borderRadius: 6,
          border: "1px dashed #d9d9d9",
          textAlign: "center",
          margin: "4px 0",
        }}
      >
        <Text type="secondary">
          {rawChapters.length === 0
            ? `No chapters created in "${classItem.name}" yet.`
            : `No chapters match the search/status filter.`}
        </Text>
        <div style={{ marginTop: 8 }}>
          <Button
            size="small"
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => onAddChapter(classItem, subjectName)}
          >
            Add Chapter to this Class
          </Button>
        </div>
      </div>
    );
  }

  const collapseItems = chapters.map((chapter) => {
    const isBlocked = chapter.isActive === false;

    return {
      key: chapter.id,
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
            paddingRight: 8,
          }}
        >
          <FolderOutlined style={{ color: "#d97706", fontSize: 16, flexShrink: 0 }} />
          {/* Chapter title spans full available width! */}
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: isBlocked ? "#8c8c8c" : "#1f1f1f",
              textDecoration: isBlocked ? "line-through" : "none",
              wordBreak: "break-word",
              flex: 1,
            }}
          >
            {chapter.name}
          </span>
          <Tag color={isBlocked ? "error" : "orange"} style={{ flexShrink: 0 }}>
            {isBlocked ? "Blocked" : "Active"}
          </Tag>
        </div>
      ),
      extra: (
        <Space size={2} onClick={(event) => event.stopPropagation()}>
          <Tooltip title="Add Topic to this Chapter">
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => onAddTopic(chapter)}
            >
              Add Topic
            </Button>
          </Tooltip>

          <Tooltip title="Edit Chapter Name">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEditChapter(chapter)}
            />
          </Tooltip>

          <Popconfirm
            title={isBlocked ? "Unblock this chapter?" : "Block this chapter?"}
            okText={isBlocked ? "Unblock" : "Block"}
            cancelText="Cancel"
            okButtonProps={{ danger: !isBlocked }}
            onConfirm={() => onToggleActive(chapter)}
          >
            <Tooltip title={isBlocked ? "Unblock Chapter" : "Block Chapter"}>
              <Button
                size="small"
                type="text"
                danger={!isBlocked}
                icon={isBlocked ? <CheckCircleOutlined /> : <StopOutlined />}
              />
            </Tooltip>
          </Popconfirm>

          <Popconfirm
            title="Delete chapter permanently?"
            description="All topics and linked content inside this chapter will be deleted!"
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDeleteChapter(chapter)}
          >
            <Tooltip title="Delete Chapter">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      children: (
        <ChapterTopicSection
          chapter={chapter}
          statusFilter={statusFilter}
          onAddTopic={onAddTopic}
          onEditTopic={onEditTopic}
          onToggleActive={onToggleTopicActive}
          onDeleteTopic={onDeleteTopic}
          onManageContent={onManageContent}
        />
      ),
      style: {
        marginBottom: 8,
        borderRadius: 6,
        background: isBlocked ? "#fff2f0" : "#ffffff",
        border: `1px solid ${isBlocked ? "#ffccc7" : "#e2e8f0"}`,
      },
    };
  });

  return (
    <Collapse
      items={collapseItems}
      bordered={false}
      style={{ background: "transparent" }}
    />
  );
}

// ==========================================
// Level 2: Subject Classes Component
// ==========================================
function SubjectClassSection({
  subject,
  statusFilter,
  searchQuery,
  onAddClass,
  onEditClass,
  onToggleActive,
  onDeleteClass,
  onAddChapter,
  onEditChapter,
  onToggleChapterActive,
  onDeleteChapter,
  onAddTopic,
  onEditTopic,
  onToggleTopicActive,
  onDeleteTopic,
  onManageContent,
}: {
  subject: SubjectItem;
  statusFilter: "all" | "active" | "blocked";
  searchQuery: string;
  onAddClass: (subject: SubjectItem) => void;
  onEditClass: (classItem: ClassItem) => void;
  onToggleActive: (classItem: ClassItem) => void;
  onDeleteClass: (classItem: ClassItem) => void;
  onAddChapter: (classItem: ClassItem, subjectName?: string) => void;
  onEditChapter: (chapter: ChapterItem) => void;
  onToggleChapterActive: (chapter: ChapterItem) => void;
  onDeleteChapter: (chapter: ChapterItem) => void;
  onAddTopic: (chapter: ChapterItem) => void;
  onEditTopic: (topic: TopicItem) => void;
  onToggleTopicActive: (topic: TopicItem) => void;
  onDeleteTopic: (topic: TopicItem) => void;
  onManageContent: (topic: TopicItem) => void;
}) {
  const { data: classesData, isFetching } = useGetClassesQuery({
    subjectId: subject.id,
    limit: 200,
  });

  const rawClasses = useMemo(() => classesData?.data ?? [], [classesData]);
  const classes = useMemo(() => {
    return rawClasses.filter((c) => {
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive !== false) ||
        (statusFilter === "blocked" && c.isActive === false);
      const matchSearch =
        !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [rawClasses, statusFilter, searchQuery]);

  if (isFetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
        <Spin size="small" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          background: "#ffffff",
          borderRadius: 6,
          border: "1px dashed #d9d9d9",
          textAlign: "center",
          margin: "4px 0",
        }}
      >
        <Text type="secondary">
          {rawClasses.length === 0
            ? `No classes created in "${subject.name}" yet.`
            : `No classes match the search/status filter.`}
        </Text>
        <div style={{ marginTop: 8 }}>
          <Button
            size="small"
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => onAddClass(subject)}
          >
            Add Class to this Subject
          </Button>
        </div>
      </div>
    );
  }

  const collapseItems = classes.map((classItem) => {
    const isBlocked = classItem.isActive === false;

    return {
      key: classItem.id,
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
            paddingRight: 8,
          }}
        >
          <ReadOutlined style={{ color: "#1677ff", fontSize: 16, flexShrink: 0 }} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: isBlocked ? "#8c8c8c" : "#1f1f1f",
              textDecoration: isBlocked ? "line-through" : "none",
              wordBreak: "break-word",
              flex: 1,
            }}
          >
            {classItem.name}
          </span>
          <Tag color={isBlocked ? "error" : "cyan"} style={{ flexShrink: 0 }}>
            {isBlocked ? "Blocked" : "Active"}
          </Tag>
        </div>
      ),
      extra: (
        <Space size={2} onClick={(event) => event.stopPropagation()}>
          <Tooltip title="Add Chapter to this Class">
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => onAddChapter(classItem, subject.name)}
            >
              Add Chapter
            </Button>
          </Tooltip>

          <Tooltip title="Edit Class Name">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEditClass(classItem)}
            />
          </Tooltip>

          <Popconfirm
            title={isBlocked ? "Unblock this class?" : "Block this class?"}
            okText={isBlocked ? "Unblock" : "Block"}
            cancelText="Cancel"
            okButtonProps={{ danger: !isBlocked }}
            onConfirm={() => onToggleActive(classItem)}
          >
            <Tooltip title={isBlocked ? "Unblock Class" : "Block Class"}>
              <Button
                size="small"
                type="text"
                danger={!isBlocked}
                icon={isBlocked ? <CheckCircleOutlined /> : <StopOutlined />}
              />
            </Tooltip>
          </Popconfirm>

          <Popconfirm
            title="Delete class permanently?"
            description="All chapters and topics under this class will be deleted!"
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDeleteClass(classItem)}
          >
            <Tooltip title="Delete Class">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      children: (
        <ClassChapterSection
          classItem={classItem}
          subjectName={subject.name}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onAddChapter={onAddChapter}
          onEditChapter={onEditChapter}
          onToggleActive={onToggleChapterActive}
          onDeleteChapter={onDeleteChapter}
          onAddTopic={onAddTopic}
          onEditTopic={onEditTopic}
          onToggleTopicActive={onToggleTopicActive}
          onDeleteTopic={onDeleteTopic}
          onManageContent={onManageContent}
        />
      ),
      style: {
        marginBottom: 8,
        borderRadius: 8,
        background: isBlocked ? "#fff2f0" : "#f8fafc",
        border: `1px solid ${isBlocked ? "#ffccc7" : "#e2e8f0"}`,
      },
    };
  });

  return (
    <Collapse
      items={collapseItems}
      bordered={false}
      style={{ background: "transparent" }}
    />
  );
}

// ==========================================
// Level 1: Curriculum Hierarchy Tree View
// ==========================================
function CurriculumTreeView({
  subjects,
  onAddClass,
  onEditSubject,
  onToggleSubjectActive,
  onDeleteSubject,
  onAddChapter,
  onEditClass,
  onToggleClassActive,
  onDeleteClass,
  onAddTopic,
  onEditChapter,
  onToggleChapterActive,
  onDeleteChapter,
  onEditTopic,
  onToggleTopicActive,
  onDeleteTopic,
  onManageContent,
}: {
  subjects: SubjectItem[];
  onAddClass: (subject: SubjectItem) => void;
  onEditSubject: (subject: SubjectItem) => void;
  onToggleSubjectActive: (subject: SubjectItem) => void;
  onDeleteSubject: (subjectId: string) => void;
  onAddChapter: (classItem: ClassItem, subjectName?: string) => void;
  onEditClass: (classItem: ClassItem) => void;
  onToggleClassActive: (classItem: ClassItem) => void;
  onDeleteClass: (classItem: ClassItem) => void;
  onAddTopic: (chapter: ChapterItem) => void;
  onEditChapter: (chapter: ChapterItem) => void;
  onToggleChapterActive: (chapter: ChapterItem) => void;
  onDeleteChapter: (chapter: ChapterItem) => void;
  onEditTopic: (topic: TopicItem) => void;
  onToggleTopicActive: (topic: TopicItem) => void;
  onDeleteTopic: (topic: TopicItem) => void;
  onManageContent: (topic: TopicItem) => void;
}) {
  const [triggerGetClasses] = useLazyGetClassesQuery();
  const [triggerGetChapters] = useLazyGetChaptersQuery();
  const [triggerGetTopics] = useLazyGetTopicsQuery();

  const [loadedChildrenMap, setLoadedChildrenMap] = useState<Record<string, TreeDataNode[]>>({});

  const onLoadData = async ({ key, children }: TreeDataNode) => {
    if (children) {
      return;
    }

    const keyStr = String(key);

    if (keyStr.startsWith("subject-")) {
      const subjectId = keyStr.replace("subject-", "");
      const res = await triggerGetClasses({ subjectId, limit: 200 }).unwrap();
      const classesList = res.data ?? [];

      const childNodes: TreeDataNode[] = classesList.map((c) => ({
        key: `class-${c.id}`,
        title: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ReadOutlined style={{ color: "#1677ff", fontSize: 15, flexShrink: 0 }} />
              <Text strong style={{ fontSize: 14, color: "#1677ff" }}>
                {c.name}
              </Text>
              <Tag color={c.isActive === false ? "error" : "cyan"}>
                {c.isActive === false ? "Blocked" : "Active"}
              </Tag>
            </div>
            <Space size={2} onClick={(e) => e.stopPropagation()}>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => onAddChapter(c)}
              >
                Add Chapter
              </Button>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEditClass(c)}
              />
              <Popconfirm
                title={c.isActive === false ? "Unblock class?" : "Block class?"}
                onConfirm={() => onToggleClassActive(c)}
              >
                <Button
                  size="small"
                  type="text"
                  danger={c.isActive !== false}
                  icon={<StopOutlined />}
                />
              </Popconfirm>
              <Popconfirm
                title="Delete class permanently?"
                onConfirm={() => onDeleteClass(c)}
              >
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </div>
        ),
        isLeaf: false,
      }));

      setLoadedChildrenMap((prev) => ({ ...prev, [keyStr]: childNodes }));
    } else if (keyStr.startsWith("class-")) {
      const classId = keyStr.replace("class-", "");
      const res = await triggerGetChapters({ classId, limit: 200 }).unwrap();
      const chaptersList = res.data ?? [];

      const childNodes: TreeDataNode[] = chaptersList.map((chap) => ({
        key: `chapter-${chap.id}`,
        title: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              <FolderOutlined style={{ color: "#d97706", fontSize: 16, flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: chap.isActive === false ? "#8c8c8c" : "#1f1f1f",
                  wordBreak: "break-word",
                }}
              >
                {chap.name}
              </span>
              <Tag color={chap.isActive === false ? "error" : "orange"} style={{ flexShrink: 0 }}>
                {chap.isActive === false ? "Blocked" : "Active"}
              </Tag>
            </div>
            <Space size={2} onClick={(e) => e.stopPropagation()}>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => onAddTopic(chap)}
              >
                Add Topic
              </Button>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEditChapter(chap)}
              />
              <Popconfirm
                title={chap.isActive === false ? "Unblock chapter?" : "Block chapter?"}
                onConfirm={() => onToggleChapterActive(chap)}
              >
                <Button
                  size="small"
                  type="text"
                  danger={chap.isActive !== false}
                  icon={<StopOutlined />}
                />
              </Popconfirm>
              <Popconfirm
                title="Delete chapter permanently?"
                onConfirm={() => onDeleteChapter(chap)}
              >
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </div>
        ),
        isLeaf: false,
      }));

      setLoadedChildrenMap((prev) => ({ ...prev, [keyStr]: childNodes }));
    } else if (keyStr.startsWith("chapter-")) {
      const chapterId = keyStr.replace("chapter-", "");
      const res = await triggerGetTopics({ chapterId, limit: 200 }).unwrap();
      const topicsList = res.data ?? [];

      const childNodes: TreeDataNode[] = topicsList.map((top, idx) => ({
        key: `topic-${top.id}`,
        title: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileTextOutlined style={{ color: "#059669", fontSize: 15, flexShrink: 0 }} />
              <Tag color="blue">#{top.order ?? idx + 1}</Tag>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: top.isActive === false ? "#8c8c8c" : "#1f1f1f",
                }}
              >
                {top.name}
              </span>
            </div>
            <Space size={2} onClick={(e) => e.stopPropagation()}>
              <Button
                size="small"
                type="primary"
                ghost
                icon={<LinkOutlined />}
                onClick={() => onManageContent(top)}
              >
                Manage Content
              </Button>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEditTopic(top)}
              />
              <Popconfirm
                title={top.isActive === false ? "Unblock topic?" : "Block topic?"}
                onConfirm={() => onToggleTopicActive(top)}
              >
                <Button
                  size="small"
                  type="text"
                  danger={top.isActive !== false}
                  icon={<StopOutlined />}
                />
              </Popconfirm>
              <Popconfirm
                title="Delete topic permanently?"
                onConfirm={() => onDeleteTopic(top)}
              >
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </div>
        ),
        isLeaf: true,
      }));

      setLoadedChildrenMap((prev) => ({ ...prev, [keyStr]: childNodes }));
    }
  };

  const treeData: TreeDataNode[] = useMemo(() => {
    return subjects.map((sub) => {
      const subKey = `subject-${sub.id}`;
      const classChildren = loadedChildrenMap[subKey];

      return {
        key: subKey,
        title: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BookOutlined style={{ color: "#722ed1", fontSize: 16, flexShrink: 0 }} />
              <Text strong style={{ fontSize: 15, color: "#722ed1" }}>
                {sub.name}
              </Text>
              <Tag color={sub.isActive === false ? "error" : "success"} style={{ backgroundColor: sub.isActive === false ? '#fff2f0' : '#f6ffed' }}>
                {sub.isActive === false ? "Blocked" : "Active"}
              </Tag>
            </div>
            <Space size={2} onClick={(e) => e.stopPropagation()}>
              <Button
                size="small"
                type="primary"
                ghost
                icon={<PlusOutlined />}
                onClick={() => onAddClass(sub)}
              >
                Add Class
              </Button>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEditSubject(sub)}
              />
              <Popconfirm
                title={sub.isActive === false ? "Unblock subject?" : "Block subject?"}
                onConfirm={() => onToggleSubjectActive(sub)}
              >
                <Button
                  size="small"
                  type="text"
                  danger={sub.isActive !== false}
                  icon={<StopOutlined />}
                />
              </Popconfirm>
              <Popconfirm
                title="Delete subject permanently?"
                onConfirm={() => onDeleteSubject(sub.id)}
              >
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </div>
        ),
        isLeaf: false,
        children: classChildren?.map((cNode) => {
          const classKey = String(cNode.key);
          const chapterChildren = loadedChildrenMap[classKey];

          return {
            ...cNode,
            children: chapterChildren?.map((chapNode) => {
              const chapKey = String(chapNode.key);
              const topicChildren = loadedChildrenMap[chapKey];

              return {
                ...chapNode,
                children: topicChildren,
              };
            }),
          };
        }),
      };
    });
  }, [
    subjects,
    loadedChildrenMap,
    onAddClass,
    onEditSubject,
    onToggleSubjectActive,
    onDeleteSubject,
  ]);

  return (
    <Card style={{ borderRadius: 8, marginTop: 12 }}>
      <Tree
        className="curriculum-tree"
        showLine={{ showLeafIcon: false }}
        loadData={onLoadData}
        treeData={treeData}
        style={{ width: "100%" }}
      />
    </Card>
  );
}

// ==========================================
// Main Curriculum Component
// ==========================================
export default function Curriculum() {
  const [viewMode, setViewMode] = useState<"accordion" | "tree">("accordion");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");

  // Modals state
  const [subjectModal, setSubjectModal] = useState<SubjectModalState>(null);
  const [classModal, setClassModal] = useState<ClassModalState>(null);
  const [chapterModal, setChapterModal] = useState<ChapterModalState>(null);
  const [topicModal, setTopicModal] = useState<TopicModalState>(null);
  const [contentModalTopic, setContentModalTopic] = useState<TopicItem | null>(null);

  // Forms
  const [subjectForm] = Form.useForm<{ name: string }>();
  const [classForm] = Form.useForm<{ name: string }>();
  const [chapterForm] = Form.useForm<{ name: string }>();
  const [topicForm] = Form.useForm<{ name: string; order?: number }>();

  // RTK Queries & Mutations
  const { data: subjectsData, isFetching: isFetchingSubjects, refetch: refetchSubjects } =
    useGetSubjectsQuery({ limit: 200 });

  const rawSubjects = useMemo(() => subjectsData?.data ?? [], [subjectsData]);
  const subjects = useMemo(() => {
    return rawSubjects.filter((s) => {
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && s.isActive !== false) ||
        (statusFilter === "blocked" && s.isActive === false);
      const matchSearch =
        !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [rawSubjects, statusFilter, searchQuery]);

  const [createSubject, { isLoading: isCreatingSubject }] = useCreateSubjectMutation();
  const [updateSubject, { isLoading: isUpdatingSubject }] = useUpdateSubjectMutation();
  const [deleteSubject] = usePermanentDeleteSubjectMutation();

  const [createClass, { isLoading: isCreatingClass }] = useCreateClassMutation();
  const [updateClass, { isLoading: isUpdatingClass }] = useUpdateClassMutation();
  const [deleteClass] = usePermanentDeleteClassMutation();

  const [createChapter, { isLoading: isCreatingChapter }] = useCreateChapterMutation();
  const [updateChapter, { isLoading: isUpdatingChapter }] = useUpdateChapterMutation();
  const [deleteChapter] = usePermanentDeleteChapterMutation();

  const [createTopic, { isLoading: isCreatingTopic }] = useCreateTopicMutation();
  const [updateTopic, { isLoading: isUpdatingTopic }] = useUpdateTopicMutation();
  const [deleteTopic] = usePermanentDeleteTopicMutation();

  // Populate modals on edit/create
  useEffect(() => {
    if (!subjectModal) return;
    if (subjectModal.mode === "edit") {
      subjectForm.setFieldsValue({ name: subjectModal.record.name });
    } else {
      subjectForm.resetFields();
    }
  }, [subjectForm, subjectModal]);

  useEffect(() => {
    if (!classModal) return;
    if (classModal.mode === "edit") {
      classForm.setFieldsValue({ name: classModal.record.name });
    } else {
      classForm.resetFields();
    }
  }, [classForm, classModal]);

  useEffect(() => {
    if (!chapterModal) return;
    if (chapterModal.mode === "edit") {
      chapterForm.setFieldsValue({ name: chapterModal.record.name });
    } else {
      chapterForm.resetFields();
    }
  }, [chapterForm, chapterModal]);

  useEffect(() => {
    if (!topicModal) return;
    if (topicModal.mode === "edit") {
      topicForm.setFieldsValue({
        name: topicModal.record.name,
        order: topicModal.record.order,
      });
    } else {
      topicForm.resetFields();
    }
  }, [topicForm, topicModal]);

  // Submit handlers
  const handleSubjectSubmit = async (values: { name: string }) => {
    try {
      if (subjectModal?.mode === "edit") {
        await updateSubject({
          id: subjectModal.record.id,
          body: { name: values.name.trim() },
        }).unwrap();
        message.success("Subject updated successfully.");
      } else {
        await createSubject({ name: values.name.trim() }).unwrap();
        message.success("Subject created successfully.");
      }
      setSubjectModal(null);
      refetchSubjects();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to save subject.");
    }
  };

  const handleClassSubmit = async (values: { name: string }) => {
    if (!classModal) return;
    try {
      if (classModal.mode === "edit") {
        await updateClass({
          id: classModal.record.id,
          body: { name: values.name.trim() },
        }).unwrap();
        message.success("Class updated successfully.");
      } else {
        await createClass({
          name: values.name.trim(),
          subjectId: classModal.subjectId,
        }).unwrap();
        message.success("Class created successfully.");
      }
      setClassModal(null);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to save class.");
    }
  };

  const handleChapterSubmit = async (values: { name: string }) => {
    if (!chapterModal) return;
    try {
      if (chapterModal.mode === "edit") {
        await updateChapter({
          id: chapterModal.record.id,
          body: { name: values.name.trim() },
        }).unwrap();
        message.success("Chapter updated successfully.");
      } else {
        await createChapter({
          name: values.name.trim(),
          classId: chapterModal.classId,
        }).unwrap();
        message.success("Chapter created successfully.");
      }
      setChapterModal(null);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to save chapter.");
    }
  };

  const handleTopicSubmit = async (values: { name: string; order?: number }) => {
    if (!topicModal) return;
    try {
      if (topicModal.mode === "edit") {
        await updateTopic({
          id: topicModal.record.id,
          body: { name: values.name.trim(), order: values.order },
        }).unwrap();
        message.success("Topic updated successfully.");
      } else {
        await createTopic({
          name: values.name.trim(),
          chapterId: topicModal.chapterId,
          order: values.order,
        }).unwrap();
        message.success("Topic created successfully.");
      }
      setTopicModal(null);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to save topic.");
    }
  };

  // Toggle active status handlers
  const handleToggleSubjectActive = async (record: SubjectItem) => {
    try {
      const nextActive = record.isActive === false;
      await updateSubject({ id: record.id, body: { isActive: nextActive } }).unwrap();
      message.success(`Subject ${nextActive ? "unblocked" : "blocked"} successfully.`);
      refetchSubjects();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to update subject status.");
    }
  };

  const handleToggleClassActive = async (record: ClassItem) => {
    try {
      const nextActive = record.isActive === false;
      await updateClass({ id: record.id, body: { isActive: nextActive } }).unwrap();
      message.success(`Class ${nextActive ? "unblocked" : "blocked"} successfully.`);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to update class status.");
    }
  };

  const handleToggleChapterActive = async (record: ChapterItem) => {
    try {
      const nextActive = record.isActive === false;
      await updateChapter({ id: record.id, body: { isActive: nextActive } }).unwrap();
      message.success(`Chapter ${nextActive ? "unblocked" : "blocked"} successfully.`);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to update chapter status.");
    }
  };

  const handleToggleTopicActive = async (record: TopicItem) => {
    try {
      const nextActive = record.isActive === false;
      await updateTopic({ id: record.id, body: { isActive: nextActive } }).unwrap();
      message.success(`Topic ${nextActive ? "unblocked" : "blocked"} successfully.`);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to update topic status.");
    }
  };

  // Delete handlers
  const handleDeleteSubject = async (id: string) => {
    try {
      await deleteSubject(id).unwrap();
      message.success("Subject deleted successfully.");
      refetchSubjects();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to delete subject.");
    }
  };

  const handleDeleteClass = async (record: ClassItem) => {
    try {
      await deleteClass(record.id).unwrap();
      message.success("Class deleted successfully.");
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to delete class.");
    }
  };

  const handleDeleteChapter = async (record: ChapterItem) => {
    try {
      await deleteChapter(record.id).unwrap();
      message.success("Chapter deleted successfully.");
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to delete chapter.");
    }
  };

  const handleDeleteTopic = async (record: TopicItem) => {
    try {
      await deleteTopic(record.id).unwrap();
      message.success("Topic deleted successfully.");
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.data?.message || apiError.message || "Unable to delete topic.");
    }
  };

  // Build Subject Accordion Items
  const subjectCollapseItems = subjects.map((subject) => {
    const isBlocked = subject.isActive === false;

    return {
      key: subject.id,
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flex: 1,
            minWidth: 0,
            paddingRight: 8,
          }}
        >
          <BookOutlined style={{ color: "#722ed1", fontSize: 18, flexShrink: 0 }} />
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: isBlocked ? "#8c8c8c" : "#1f1f1f",
              textDecoration: isBlocked ? "line-through" : "none",
              wordBreak: "break-word",
              flex: 1,
            }}
          >
            {subject.name}
          </span>
          <Tag color={isBlocked ? "error" : "success"} style={{ flexShrink: 0, backgroundColor: isBlocked ? '#fff2f0' : '#f6ffed' }}>
            {isBlocked ? "Blocked" : "Active"}
          </Tag>
        </div>
      ),
      extra: (
        <Space size={4} onClick={(event) => event.stopPropagation()}>
          <Tooltip title="Add a Class under this Subject">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<PlusOutlined />}
              onClick={() =>
                setClassModal({
                  mode: "create",
                  subjectId: subject.id,
                  subjectName: subject.name,
                })
              }
            >
              Add Class
            </Button>
          </Tooltip>

          <Tooltip title="Edit Subject Name">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => setSubjectModal({ mode: "edit", record: subject })}
            />
          </Tooltip>

          <Popconfirm
            title={isBlocked ? "Unblock this subject?" : "Block this subject?"}
            okText={isBlocked ? "Unblock" : "Block"}
            cancelText="Cancel"
            okButtonProps={{ danger: !isBlocked }}
            onConfirm={() => handleToggleSubjectActive(subject)}
          >
            <Tooltip title={isBlocked ? "Unblock Subject" : "Block Subject"}>
              <Button
                size="small"
                type="text"
                danger={!isBlocked}
                icon={isBlocked ? <CheckCircleOutlined /> : <StopOutlined />}
              />
            </Tooltip>
          </Popconfirm>

          <Popconfirm
            title="Delete subject permanently?"
            description="All classes, chapters, and topics under this subject will be deleted!"
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteSubject(subject.id)}
          >
            <Tooltip title="Delete Subject">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      children: (
        <SubjectClassSection
          subject={subject}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onAddClass={(sub) =>
            setClassModal({ mode: "create", subjectId: sub.id, subjectName: sub.name })
          }
          onEditClass={(c) => setClassModal({ mode: "edit", record: c })}
          onToggleActive={handleToggleClassActive}
          onDeleteClass={handleDeleteClass}
          onAddChapter={(c, sName) =>
            setChapterModal({
              mode: "create",
              classId: c.id,
              className: c.name,
              subjectName: sName,
            })
          }
          onEditChapter={(chap) => setChapterModal({ mode: "edit", record: chap })}
          onToggleChapterActive={handleToggleChapterActive}
          onDeleteChapter={handleDeleteChapter}
          onAddTopic={(chap) =>
            setTopicModal({
              mode: "create",
              chapterId: chap.id,
              chapterName: chap.name,
            })
          }
          onEditTopic={(top) => setTopicModal({ mode: "edit", record: top })}
          onToggleTopicActive={handleToggleTopicActive}
          onDeleteTopic={handleDeleteTopic}
          onManageContent={(top) => setContentModalTopic(top)}
        />
      ),
      style: {
        marginBottom: 12,
        borderRadius: 8,
        background: isBlocked ? "#fff2f0" : "#ffffff",
        border: `1px solid ${isBlocked ? "#ffccc7" : "#e2e8f0"}`,
      },
    };
  });

  return (
    <Card style={{ borderRadius: 8 }}>
      {/* Header Toolbar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Curriculum Management
            </Title>
            <Text type="secondary">
              Expand subjects and classes to view and organize your full chapter hierarchy.
              Link videos, notes, and MCQ tests directly to topics.
            </Text>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setSubjectModal({ mode: "create" })}
          >
            Add Subject
          </Button>
        </div>

        {/* Filters & View Switcher */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            padding: "12px 16px",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #f1f5f9",
          }}
        >
          <Space wrap size={12}>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 240 }}
            />

            <Segmented
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as "all" | "active" | "blocked")}
              options={[
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Blocked", value: "blocked" },
              ]}
            />
          </Space>

          <Space size={12}>
            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as "accordion" | "tree")}
              options={[
                { label: "Accordion View", value: "accordion", icon: <BarsOutlined /> },
                { label: "Tree View", value: "tree", icon: <ApartmentOutlined /> },
              ]}
            />
          </Space>
        </div>
      </div>

      {/* Main Content Area */}
      {isFetchingSubjects ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Spin size="large" />
        </div>
      ) : subjects.length === 0 ? (
        <Empty
          description={
            rawSubjects.length === 0
              ? "No subjects created yet. Click 'Add Subject' to start building your curriculum."
              : "No subjects match your current search/filter."
          }
          style={{ padding: "32px 0" }}
        >
          {rawSubjects.length === 0 && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setSubjectModal({ mode: "create" })}
            >
              Add Subject
            </Button>
          )}
        </Empty>
      ) : viewMode === "accordion" ? (
        <Collapse
          items={subjectCollapseItems}
          bordered={false}
          style={{ background: "transparent" }}
        />
      ) : (
        <CurriculumTreeView
          subjects={subjects}
          onAddClass={(sub) =>
            setClassModal({ mode: "create", subjectId: sub.id, subjectName: sub.name })
          }
          onEditSubject={(sub) => setSubjectModal({ mode: "edit", record: sub })}
          onToggleSubjectActive={handleToggleSubjectActive}
          onDeleteSubject={handleDeleteSubject}
          onAddChapter={(c, sName) =>
            setChapterModal({
              mode: "create",
              classId: c.id,
              className: c.name,
              subjectName: sName,
            })
          }
          onEditClass={(c) => setClassModal({ mode: "edit", record: c })}
          onToggleClassActive={handleToggleClassActive}
          onDeleteClass={handleDeleteClass}
          onAddTopic={(chap) =>
            setTopicModal({
              mode: "create",
              chapterId: chap.id,
              chapterName: chap.name,
            })
          }
          onEditChapter={(chap) => setChapterModal({ mode: "edit", record: chap })}
          onToggleChapterActive={handleToggleChapterActive}
          onDeleteChapter={handleDeleteChapter}
          onEditTopic={(top) => setTopicModal({ mode: "edit", record: top })}
          onToggleTopicActive={handleToggleTopicActive}
          onDeleteTopic={handleDeleteTopic}
          onManageContent={(top) => setContentModalTopic(top)}
        />
      )}

      {/* Subject Modal */}
      <Modal
        title={subjectModal?.mode === "edit" ? "Edit Subject" : "Add Subject"}
        open={!!subjectModal}
        onCancel={() => setSubjectModal(null)}
        onOk={() => subjectForm.submit()}
        confirmLoading={isCreatingSubject || isUpdatingSubject}
        destroyOnHidden
      >
        <Form form={subjectForm} layout="vertical" requiredMark={false} onFinish={handleSubjectSubmit}>
          <Form.Item
            name="name"
            label="Subject Name"
            rules={[{ required: true, message: "Subject name is required." }]}
          >
            <Input placeholder="Example: Mathematics, Physics, Chemistry" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Class Modal */}
      <Modal
        title={
          classModal?.mode === "edit"
            ? "Edit Class"
            : `Add Class ${classModal?.subjectName ? `to "${classModal.subjectName}"` : ""}`
        }
        open={!!classModal}
        onCancel={() => setClassModal(null)}
        onOk={() => classForm.submit()}
        confirmLoading={isCreatingClass || isUpdatingClass}
        destroyOnHidden
      >
        <Form form={classForm} layout="vertical" requiredMark={false} onFinish={handleClassSubmit}>
          <Form.Item
            name="name"
            label="Class Name"
            rules={[{ required: true, message: "Class name is required." }]}
          >
            <Input placeholder="Example: Class 10, Class 11, NEET Batch" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Chapter Modal */}
      <Modal
        title={
          chapterModal?.mode === "edit"
            ? "Edit Chapter"
            : `Add Chapter ${chapterModal?.className ? `to "${chapterModal.className}"` : ""}`
        }
        open={!!chapterModal}
        onCancel={() => setChapterModal(null)}
        onOk={() => chapterForm.submit()}
        confirmLoading={isCreatingChapter || isUpdatingChapter}
        destroyOnHidden
      >
        <Form form={chapterForm} layout="vertical" requiredMark={false} onFinish={handleChapterSubmit}>
          <Form.Item
            name="name"
            label="Chapter Name"
            rules={[{ required: true, message: "Chapter name is required." }]}
          >
            <Input placeholder="Example: Chapter 4: Quadratic Equations and Complex Numbers" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Topic Modal */}
      <Modal
        title={
          topicModal?.mode === "edit"
            ? "Edit Topic"
            : `Add Topic ${topicModal?.chapterName ? `to "${topicModal.chapterName}"` : ""}`
        }
        open={!!topicModal}
        onCancel={() => setTopicModal(null)}
        onOk={() => topicForm.submit()}
        confirmLoading={isCreatingTopic || isUpdatingTopic}
        destroyOnHidden
      >
        <Form form={topicForm} layout="vertical" requiredMark={false} onFinish={handleTopicSubmit}>
          <Form.Item
            name="name"
            label="Topic Name"
            rules={[{ required: true, message: "Topic name is required." }]}
          >
            <Input placeholder="Example: Solving Equations by Completing the Square" />
          </Form.Item>
          <Form.Item name="order" label="Display Order (Optional)">
            <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 1" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Content Modal for linking Videos, Notes, MCQ Tests */}
      <TopicContentModal
        open={!!contentModalTopic}
        topicId={contentModalTopic?.id}
        topicName={contentModalTopic?.name}
        onClose={() => setContentModalTopic(null)}
      />
    </Card>
  );
}
