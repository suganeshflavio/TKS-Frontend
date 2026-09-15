"use client";

import { useMemo, useState } from "react";
import { Button, Divider, Empty, InputNumber, Modal, Select, Space, Tag, Typography, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetCourseByIdQuery,
  useLinkCourseMcqTestMutation,
  useLinkCourseNotesMutation,
  useLinkCourseSubjectMutation,
  useLinkCourseVideoMutation,
  useUnlinkCourseMcqTestMutation,
  useUnlinkCourseNotesMutation,
  useUnlinkCourseSubjectMutation,
  useUnlinkCourseVideoMutation,
  type CourseItem,
} from "@/store/features/coursesApi";
import { useGetSubjectsQuery } from "@/store/features/subjectsApi";
import { useGetClassesQuery } from "@/store/features/classesApi";
import { useGetVideosQuery } from "@/store/features/videosApi";
import { useGetNotesListQuery } from "@/store/features/notesApi";
import { useGetTestsQuery } from "@/store/features/testsApi";

const { Text } = Typography;

interface Props {
  readonly open: boolean;
  readonly courseId?: string;
  readonly courseName?: string;
  readonly onClose: () => void;
}

type ClassScopedLink = {
  linkId: string;
  itemId: string;
  itemLabel: string;
  classId?: string | null;
  className?: string | null;
};

function ClassScopedLinkSection({
  title,
  linked,
  options,
  classOptions,
  isLinking,
  onAdd,
  onRemove,
}: {
  title: string;
  linked: ClassScopedLink[];
  options: { id: string; label: string }[];
  classOptions: { id: string; label: string }[];
  isLinking: boolean;
  onAdd: (itemId: string, classId: string, order?: number) => void;
  onRemove: (linkId: string) => void;
}) {
  const [itemId, setItemId] = useState<string | undefined>();
  const [classId, setClassId] = useState<string | undefined>();
  const [order, setOrder] = useState<number | null>(null);

  const alreadyLinkedForItem = useMemo(
    () => linked.filter((item) => item.itemId === itemId && item.classId).map((item) => item.classId as string),
    [linked, itemId],
  );

  const classSelectOptions = classOptions.filter((option) => !alreadyLinkedForItem.includes(option.id));

  const reset = () => {
    setItemId(undefined);
    setClassId(undefined);
    setOrder(null);
  };

  const singular = title.toLowerCase().replace(/s$/, "");

  return (
    <div>
      <Text strong>{title}</Text>
      <div style={{ marginTop: 8 }}>
        {linked.length === 0 ? (
          <Empty description={`No ${title.toLowerCase()} linked yet.`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {linked.map((item) => (
              <div
                key={item.linkId}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
              >
                <Space size={4}>
                  <Tag>{item.itemLabel}</Tag>
                  <Tag color={item.classId ? "blue" : "default"}>{item.className ?? "All classes"}</Tag>
                </Space>
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemove(item.linkId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <Space style={{ marginTop: 8, width: "100%" }} wrap>
        <Select
          showSearch
          allowClear
          style={{ minWidth: 220 }}
          placeholder={`Link an existing ${singular}`}
          value={itemId}
          options={options.map((option) => ({ value: option.id, label: option.label }))}
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          onChange={(value) => {
            setItemId(value);
            setClassId(undefined);
          }}
        />
        <Select
          showSearch
          style={{ minWidth: 200 }}
          placeholder="Class"
          disabled={!itemId}
          value={classId}
          options={classSelectOptions.map((option) => ({ value: option.id, label: option.label }))}
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          onChange={(value) => setClassId(value)}
        />
        <InputNumber placeholder="Order (optional)" value={order} onChange={(value) => setOrder(value)} />
        <Button
          type="primary"
          loading={isLinking}
          disabled={!itemId || !classId}
          onClick={() => {
            if (itemId && classId) {
              onAdd(itemId, classId, order ?? undefined);
              reset();
            }
          }}
        >
          Link
        </Button>
      </Space>
    </div>
  );
}

type CourseSubjectLink = NonNullable<CourseItem["subjects"]>[number];

function SubjectLinkSection({
  linked,
  subjectOptions,
  isLinking,
  onAdd,
  onRemove,
}: {
  linked: CourseSubjectLink[];
  subjectOptions: { id: string; label: string }[];
  isLinking: boolean;
  onAdd: (subjectId: string, classId: string | undefined, order?: number) => void;
  onRemove: (linkId: string) => void;
}) {
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [classId, setClassId] = useState<string | undefined>();
  const [order, setOrder] = useState<number | null>(null);

  const { data: classesData, isFetching: isLoadingClasses } = useGetClassesQuery(
    subjectId ? { subjectId, limit: 200 } : skipToken,
  );
  const classOptions = classesData?.data ?? [];

  const alreadyLinkedForSubject = useMemo(
    () =>
      linked
        .filter((item) => item.subject.id === subjectId && item.class?.id)
        .map((item) => item.class!.id),
    [linked, subjectId],
  );

  const classSelectOptions = classOptions
    .map((c) => ({ value: c.id, label: c.name }))
    .filter((option) => !alreadyLinkedForSubject.includes(option.value));

  const reset = () => {
    setSubjectId(undefined);
    setClassId(undefined);
    setOrder(null);
  };

  return (
    <div>
      <Text strong>Subjects</Text>
      <div style={{ marginTop: 8 }}>
        {linked.length === 0 ? (
          <Empty description="No subjects linked yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {linked.map((item) => (
              <div
                key={item.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
              >
                <Space size={4}>
                  <Tag>{item.subject.name}</Tag>
                  <Tag color={item.class ? "blue" : "default"}>{item.class ? item.class.name : "All classes"}</Tag>
                </Space>
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemove(item.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <Space style={{ marginTop: 8, width: "100%" }} wrap>
        <Select
          showSearch
          allowClear
          style={{ minWidth: 200 }}
          placeholder="Subject"
          value={subjectId}
          options={subjectOptions.map((option) => ({ value: option.id, label: option.label }))}
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          onChange={(value) => {
            setSubjectId(value);
            setClassId(undefined);
          }}
        />
        <Select
          style={{ minWidth: 220 }}
          placeholder="Class"
          disabled={!subjectId}
          loading={isLoadingClasses}
          value={classId}
          options={classSelectOptions}
          onChange={(value) => setClassId(value)}
        />
        <InputNumber placeholder="Order (optional)" value={order} onChange={(value) => setOrder(value)} />
        <Button
          type="primary"
          loading={isLinking}
          disabled={!subjectId || !classId}
          onClick={() => {
            if (subjectId && classId) {
              onAdd(subjectId, classId, order ?? undefined);
              reset();
            }
          }}
        >
          Link
        </Button>
      </Space>
    </div>
  );
}

export default function CourseContentModal({ open, courseId, courseName, onClose }: Props) {
  const { data: course } = useGetCourseByIdQuery(open && courseId ? courseId : skipToken);

  const { data: subjectsData } = useGetSubjectsQuery({ limit: 500 });
  const { data: allClassesData } = useGetClassesQuery({ limit: 500 });
  const { data: videosData } = useGetVideosQuery({ page: 1, limit: 500 });
  const { data: notesData } = useGetNotesListQuery({ page: 1, limit: 500 });
  const { data: testsData } = useGetTestsQuery({ page: 1, limit: 500 });

  const [linkSubject, { isLoading: isLinkingSubject }] = useLinkCourseSubjectMutation();
  const [unlinkSubject] = useUnlinkCourseSubjectMutation();
  const [linkVideo, { isLoading: isLinkingVideo }] = useLinkCourseVideoMutation();
  const [unlinkVideo] = useUnlinkCourseVideoMutation();
  const [linkNotes, { isLoading: isLinkingNotes }] = useLinkCourseNotesMutation();
  const [unlinkNotes] = useUnlinkCourseNotesMutation();
  const [linkMcqTest, { isLoading: isLinkingMcqTest }] = useLinkCourseMcqTestMutation();
  const [unlinkMcqTest] = useUnlinkCourseMcqTestMutation();

  const subjectOptions = useMemo(
    () => (subjectsData?.data ?? []).map((subject) => ({ id: subject.id, label: subject.name })),
    [subjectsData],
  );
  const videoOptions = useMemo(
    () => (videosData?.data ?? []).map((video) => ({ id: video.id, label: video.videoName ?? video.id })),
    [videosData],
  );
  const notesOptions = useMemo(
    () => (notesData?.data ?? []).map((note) => ({ id: note.id, label: note.title ?? note.id })),
    [notesData],
  );
  const testOptions = useMemo(
    () => (testsData?.tests ?? []).map((test) => ({ id: test.id, label: test.testName ?? test.id })),
    [testsData],
  );
  const classOptions = useMemo(
    () =>
      (allClassesData?.data ?? []).map((klass) => ({
        id: klass.id,
        label: klass.subject ? `${klass.name} · ${klass.subject.name}` : klass.name,
      })),
    [allClassesData],
  );

  const linkedVideos = useMemo(
    () =>
      (course?.videos ?? []).map((item) => ({
        linkId: item.id,
        itemId: item.video.id,
        itemLabel: item.video.videoName,
        classId: item.class?.id,
        className: item.class?.name,
      })),
    [course],
  );
  const linkedNotes = useMemo(
    () =>
      (course?.notes ?? []).map((item) => ({
        linkId: item.id,
        itemId: item.notes.id,
        itemLabel: item.notes.title,
        classId: item.class?.id,
        className: item.class?.name,
      })),
    [course],
  );
  const linkedTests = useMemo(
    () =>
      (course?.mcqTests ?? []).map((item) => ({
        linkId: item.id,
        itemId: item.test.id,
        itemLabel: item.test.testName,
        classId: item.class?.id,
        className: item.class?.name,
      })),
    [course],
  );

  const guard = (promise: Promise<unknown>, successMessage: string) =>
    promise
      .then(() => message.success(successMessage))
      .catch((error: unknown) => message.error((error as Error)?.message || "Something went wrong."));

  return (
    <Modal
      title={courseName ? `Manage content for "${courseName}"` : "Manage course content"}
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      width={680}
      destroyOnHidden
    >
      {!courseId ? null : (
        <Space direction="vertical" size="large" style={{ width: "100%" }} styles={{ item: { width: "100%" } }}>
          <SubjectLinkSection
            linked={course?.subjects ?? []}
            subjectOptions={subjectOptions}
            isLinking={isLinkingSubject}
            onAdd={(subjectId, classId, order) =>
              guard(linkSubject({ courseId, subjectId, classId, order }).unwrap(), "Subject linked.")
            }
            onRemove={(linkId) => guard(unlinkSubject({ courseId, linkId }).unwrap(), "Subject unlinked.")}
          />
          <Divider style={{ margin: "4px 0" }} />
          <ClassScopedLinkSection
            title="Videos"
            linked={linkedVideos}
            options={videoOptions}
            classOptions={classOptions}
            isLinking={isLinkingVideo}
            onAdd={(videoId, classId, order) =>
              guard(linkVideo({ courseId, videoId, classId, order }).unwrap(), "Video linked.")
            }
            onRemove={(linkId) => guard(unlinkVideo({ courseId, linkId }).unwrap(), "Video unlinked.")}
          />
          <Divider style={{ margin: "4px 0" }} />
          <ClassScopedLinkSection
            title="Notes"
            linked={linkedNotes}
            options={notesOptions}
            classOptions={classOptions}
            isLinking={isLinkingNotes}
            onAdd={(notesId, classId, order) =>
              guard(linkNotes({ courseId, notesId, classId, order }).unwrap(), "Notes linked.")
            }
            onRemove={(linkId) => guard(unlinkNotes({ courseId, linkId }).unwrap(), "Notes unlinked.")}
          />
          <Divider style={{ margin: "4px 0" }} />
          <ClassScopedLinkSection
            title="MCQ Tests"
            linked={linkedTests}
            options={testOptions}
            classOptions={classOptions}
            isLinking={isLinkingMcqTest}
            onAdd={(testId, classId, order) =>
              guard(linkMcqTest({ courseId, testId, classId, order }).unwrap(), "MCQ test linked.")
            }
            onRemove={(linkId) => guard(unlinkMcqTest({ courseId, linkId }).unwrap(), "MCQ test unlinked.")}
          />
        </Space>
      )}
    </Modal>
  );
}
