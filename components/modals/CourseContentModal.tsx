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

function LinkSection<T extends { id: string; label: string }>({
  title,
  linked,
  options,
  onAdd,
  onRemove,
  isLinking,
}: {
  title: string;
  linked: T[];
  options: T[];
  onAdd: (id: string, order?: number) => void;
  onRemove: (id: string) => void;
  isLinking: boolean;
}) {
  const [selected, setSelected] = useState<string | undefined>();
  const [order, setOrder] = useState<number | null>(null);
  const availableOptions = options.filter((option) => !linked.some((item) => item.id === option.id));

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
                key={item.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
              >
                <Tag>{item.label}</Tag>
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
          style={{ minWidth: 240 }}
          placeholder={`Link an existing ${title.toLowerCase().replace(/s$/, "")}`}
          value={selected}
          options={availableOptions.map((option) => ({ value: option.id, label: option.label }))}
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          onChange={(value) => setSelected(value)}
        />
        <InputNumber placeholder="Order (optional)" value={order} onChange={(value) => setOrder(value)} />
        <Button
          type="primary"
          loading={isLinking}
          disabled={!selected}
          onClick={() => {
            if (selected) {
              onAdd(selected, order ?? undefined);
              setSelected(undefined);
              setOrder(null);
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

  const linkedVideos = useMemo(
    () => (course?.videos ?? []).map((item) => ({ id: item.video.id, label: item.video.videoName })),
    [course],
  );
  const linkedNotes = useMemo(
    () => (course?.notes ?? []).map((item) => ({ id: item.notes.id, label: item.notes.title })),
    [course],
  );
  const linkedTests = useMemo(
    () => (course?.mcqTests ?? []).map((item) => ({ id: item.test.id, label: item.test.testName })),
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
          <LinkSection
            title="Videos"
            linked={linkedVideos}
            options={videoOptions}
            isLinking={isLinkingVideo}
            onAdd={(videoId, order) => guard(linkVideo({ courseId, videoId, order }).unwrap(), "Video linked.")}
            onRemove={(videoId) => guard(unlinkVideo({ courseId, videoId }).unwrap(), "Video unlinked.")}
          />
          <Divider style={{ margin: "4px 0" }} />
          <LinkSection
            title="Notes"
            linked={linkedNotes}
            options={notesOptions}
            isLinking={isLinkingNotes}
            onAdd={(notesId, order) => guard(linkNotes({ courseId, notesId, order }).unwrap(), "Notes linked.")}
            onRemove={(notesId) => guard(unlinkNotes({ courseId, notesId }).unwrap(), "Notes unlinked.")}
          />
          <Divider style={{ margin: "4px 0" }} />
          <LinkSection
            title="MCQ Tests"
            linked={linkedTests}
            options={testOptions}
            isLinking={isLinkingMcqTest}
            onAdd={(testId, order) => guard(linkMcqTest({ courseId, testId, order }).unwrap(), "MCQ test linked.")}
            onRemove={(testId) => guard(unlinkMcqTest({ courseId, testId }).unwrap(), "MCQ test unlinked.")}
          />
        </Space>
      )}
    </Modal>
  );
}
