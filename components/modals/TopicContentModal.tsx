"use client";

import { useMemo, useState } from "react";
import { Button, Divider, Empty, Modal, Select, Space, Tag, Typography, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetTopicByIdQuery,
  useLinkMcqTestToTopicMutation,
  useLinkNotesToTopicMutation,
  useLinkVideoToTopicMutation,
  useUnlinkMcqTestFromTopicMutation,
  useUnlinkNotesFromTopicMutation,
  useUnlinkVideoFromTopicMutation,
} from "@/store/features/topicsApi";
import { useGetVideosQuery } from "@/store/features/videosApi";
import { useGetTestsQuery } from "@/store/features/testsApi";
import { useGetNotesListQuery } from "@/store/features/notesApi";

const { Text } = Typography;

interface Props {
  readonly open: boolean;
  readonly topicId?: string;
  readonly topicName?: string;
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
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  isLinking: boolean;
}) {
  const [selected, setSelected] = useState<string | undefined>();
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
      <Space style={{ marginTop: 8, width: "100%" }}>
        <Select
          showSearch
          allowClear
          style={{ minWidth: 260 }}
          placeholder={`Link an existing ${title.toLowerCase().replace(/s$/, "")}`}
          value={selected}
          options={availableOptions.map((option) => ({ value: option.id, label: option.label }))}
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          onChange={(value) => setSelected(value)}
        />
        <Button
          type="primary"
          loading={isLinking}
          disabled={!selected}
          onClick={() => {
            if (selected) {
              onAdd(selected);
              setSelected(undefined);
            }
          }}
        >
          Link
        </Button>
      </Space>
    </div>
  );
}

export default function TopicContentModal({ open, topicId, topicName, onClose }: Props) {
  const { data: topic } = useGetTopicByIdQuery(open && topicId ? topicId : skipToken);

  const { data: videosData } = useGetVideosQuery({ page: 1, limit: 500 });
  const { data: testsData } = useGetTestsQuery({ page: 1, limit: 500 });
  const { data: notesData } = useGetNotesListQuery({ page: 1, limit: 500 });

  const [linkVideo, { isLoading: isLinkingVideo }] = useLinkVideoToTopicMutation();
  const [unlinkVideo] = useUnlinkVideoFromTopicMutation();
  const [linkMcqTest, { isLoading: isLinkingMcqTest }] = useLinkMcqTestToTopicMutation();
  const [unlinkMcqTest] = useUnlinkMcqTestFromTopicMutation();
  const [linkNotes, { isLoading: isLinkingNotes }] = useLinkNotesToTopicMutation();
  const [unlinkNotes] = useUnlinkNotesFromTopicMutation();

  const videoOptions = useMemo(
    () => (videosData?.data ?? []).map((video) => ({ id: video.id, label: video.videoName ?? video.id })),
    [videosData],
  );
  const testOptions = useMemo(
    () => (testsData?.tests ?? []).map((test) => ({ id: test.id, label: test.testName ?? test.id })),
    [testsData],
  );
  const notesOptions = useMemo(
    () => (notesData?.data ?? []).map((note) => ({ id: note.id, label: note.title ?? note.id })),
    [notesData],
  );

  const linkedVideos = useMemo(
    () => (topic?.videos ?? []).map((video) => ({ id: video.id, label: video.videoName })),
    [topic],
  );
  const linkedTests = useMemo(
    () => (topic?.mcqTests ?? []).map((test) => ({ id: test.id, label: test.testName })),
    [topic],
  );
  const linkedNotes = useMemo(
    () => (topic?.notes ?? []).map((note) => ({ id: note.id, label: note.title })),
    [topic],
  );

  const guard = (promise: Promise<unknown>, successMessage: string) =>
    promise
      .then(() => message.success(successMessage))
      .catch((error: unknown) => message.error((error as Error)?.message || "Something went wrong."));

  return (
    <Modal
      title={topicName ? `Manage content for "${topicName}"` : "Manage topic content"}
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      width={640}
      destroyOnHidden
    >
      {!topicId ? null : (
        <Space direction="vertical" size="large" style={{ width: "100%" }} styles={{ item: { width: "100%" } }}>
          <LinkSection
            title="Videos"
            linked={linkedVideos}
            options={videoOptions}
            isLinking={isLinkingVideo}
            onAdd={(videoId) => guard(linkVideo({ topicId, videoId }).unwrap(), "Video linked.")}
            onRemove={(videoId) => guard(unlinkVideo({ topicId, videoId }).unwrap(), "Video unlinked.")}
          />
          <Divider style={{ margin: "4px 0" }} />
          <LinkSection
            title="MCQ Tests"
            linked={linkedTests}
            options={testOptions}
            isLinking={isLinkingMcqTest}
            onAdd={(testId) => guard(linkMcqTest({ topicId, testId }).unwrap(), "MCQ test linked.")}
            onRemove={(testId) => guard(unlinkMcqTest({ topicId, testId }).unwrap(), "MCQ test unlinked.")}
          />
          <Divider style={{ margin: "4px 0" }} />
          <LinkSection
            title="Notes"
            linked={linkedNotes}
            options={notesOptions}
            isLinking={isLinkingNotes}
            onAdd={(notesId) => guard(linkNotes({ topicId, notesId }).unwrap(), "Notes linked.")}
            onRemove={(notesId) => guard(unlinkNotes({ topicId, notesId }).unwrap(), "Notes unlinked.")}
          />
        </Space>
      )}
    </Modal>
  );
}
