"use client";

import { useMemo, useState } from "react";
import { Modal, Select, Space, Typography, message } from "antd";
import {
  useGetTopicsQuery,
  useLinkMcqTestToTopicMutation,
  useLinkNotesToTopicMutation,
  useLinkVideoToTopicMutation,
} from "@/store/features/topicsApi";

const { Text } = Typography;

type EntityKind = "video" | "notes" | "mcq";

interface Props {
  readonly open: boolean;
  readonly kind: EntityKind;
  readonly entityId?: string;
  readonly entityLabel?: string;
  readonly onClose: () => void;
}

const KIND_LABEL: Record<EntityKind, string> = {
  video: "video",
  notes: "notes",
  mcq: "MCQ test",
};

export default function LinkToTopicModal({ open, kind, entityId, entityLabel, onClose }: Props) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>();

  const { data: topicsData, isFetching } = useGetTopicsQuery(open ? { page: 1, limit: 500 } : { limit: 0 });
  const topics = useMemo(() => topicsData?.data ?? [], [topicsData]);

  const [linkVideo, { isLoading: isLinkingVideo }] = useLinkVideoToTopicMutation();
  const [linkMcqTest, { isLoading: isLinkingMcqTest }] = useLinkMcqTestToTopicMutation();
  const [linkNotes, { isLoading: isLinkingNotes }] = useLinkNotesToTopicMutation();

  const isLinking = isLinkingVideo || isLinkingMcqTest || isLinkingNotes;

  const handleClose = () => {
    setSelectedTopicId(undefined);
    onClose();
  };

  const handleLink = async () => {
    if (!entityId || !selectedTopicId) {
      return;
    }

    try {
      if (kind === "video") {
        await linkVideo({ topicId: selectedTopicId, videoId: entityId }).unwrap();
      } else if (kind === "mcq") {
        await linkMcqTest({ topicId: selectedTopicId, testId: entityId }).unwrap();
      } else {
        await linkNotes({ topicId: selectedTopicId, notesId: entityId }).unwrap();
      }

      message.success(`Linked to topic successfully.`);
      handleClose();
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to link to topic.");
    }
  };

  return (
    <Modal
      title={entityLabel ? `Link "${entityLabel}" to a topic` : `Link ${KIND_LABEL[kind]} to a topic`}
      open={open}
      onCancel={handleClose}
      onOk={handleLink}
      okText="Link"
      okButtonProps={{ disabled: !selectedTopicId, loading: isLinking }}
      destroyOnHidden
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Text type="secondary">
          A {KIND_LABEL[kind]} can be linked to any number of topics — this doesn&apos;t remove it from topics it&apos;s
          already linked to.
        </Text>
        <Select
          showSearch
          style={{ width: "100%" }}
          placeholder="Select a topic"
          loading={isFetching}
          value={selectedTopicId}
          onChange={setSelectedTopicId}
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          options={topics.map((topic) => ({
            value: topic.id,
            label: topic.chapter
              ? `${topic.chapter.class?.subject?.name ?? ""} / ${topic.chapter.class?.name ?? ""} / ${topic.chapter.name} / ${topic.name}`
              : topic.name,
          }))}
        />
      </Space>
    </Modal>
  );
}
