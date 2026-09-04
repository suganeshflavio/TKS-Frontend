"use client";

import { useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Collapse,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { CommentOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import {
  type CommentItem,
  type VideoCommentGroup,
  useDeleteCommentMutation,
  useGetCommentsQuery,
  useReplyToCommentMutation,
} from "@/store/features/commentsApi";

const { Title, Text } = Typography;

type ReplyFormValues = {
  message: string;
};

type ReplyModalState = {
  open: boolean;
  commentId: string | null;
  username: string;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

function CommentRow({
  comment,
  onReply,
  onDelete,
  deletingId,
  indent = false,
}: {
  comment: CommentItem;
  onReply: (comment: CommentItem) => void;
  onDelete: (comment: CommentItem) => void;
  deletingId: string | null;
  indent?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 12, marginLeft: indent ? 40 : 0, marginTop: 12 }}>
      <Avatar icon={<UserOutlined />} />
      <div style={{ flex: 1 }}>
        <Space size={8} wrap>
          <Text strong>{comment.username}</Text>
          <Tag color={comment.role === "ADMIN" ? "blue" : "default"}>{comment.role}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatDateTime(comment.dateandtime)}
          </Text>
        </Space>
        <div>{comment.message}</div>
        <Space size="small">
          <Button size="small" type="link" onClick={() => onReply(comment)}>
            Reply
          </Button>
          <Popconfirm
            title="Delete this comment?"
            description="This will also delete any replies to it."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === comment.id }}
            onConfirm={() => onDelete(comment)}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />} loading={deletingId === comment.id}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </div>
    </div>
  );
}

function CommentThread({
  comments,
  onReply,
  onDelete,
  deletingId,
}: {
  comments: CommentItem[];
  onReply: (comment: CommentItem) => void;
  onDelete: (comment: CommentItem) => void;
  deletingId: string | null;
}) {
  const topLevel = comments.filter((comment) => !comment.parentId);
  const repliesByParent = useMemo(() => {
    const map = new Map<string, CommentItem[]>();

    for (const comment of comments) {
      if (!comment.parentId) {
        continue;
      }

      const existing = map.get(comment.parentId) ?? [];
      existing.push(comment);
      map.set(comment.parentId, existing);
    }

    return map;
  }, [comments]);

  if (topLevel.length === 0) {
    return <Empty description="No comments yet." />;
  }

  return (
    <div>
      {topLevel.map((comment) => (
        <div key={comment.id}>
          <CommentRow comment={comment} onReply={onReply} onDelete={onDelete} deletingId={deletingId} />
          {(repliesByParent.get(comment.id) ?? []).map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              deletingId={deletingId}
              indent
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Comments() {
  const [form] = Form.useForm<ReplyFormValues>();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replyModal, setReplyModal] = useState<ReplyModalState>({
    open: false,
    commentId: null,
    username: "",
  });

  const { data, isFetching } = useGetCommentsQuery({
    page,
    limit,
    search: searchText || undefined,
  });

  const [replyToComment, { isLoading: isReplying }] = useReplyToCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const videoGroups: VideoCommentGroup[] = data?.videos ?? [];
  const total = data?.total ?? videoGroups.length;

  const openReplyModal = (comment: CommentItem) => {
    setReplyModal({ open: true, commentId: comment.id, username: comment.username });
    form.resetFields();
  };

  const resetReplyModal = () => {
    setReplyModal({ open: false, commentId: null, username: "" });
    form.resetFields();
  };

  const onSubmitReply = async (values: ReplyFormValues) => {
    if (!replyModal.commentId) {
      return;
    }

    try {
      await replyToComment({ id: replyModal.commentId, message: values.message.trim() }).unwrap();
      message.success("Reply posted successfully.");
      resetReplyModal();
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to post reply.");
    }
  };

  const onDeleteComment = async (comment: CommentItem) => {
    try {
      setDeletingId(comment.id);
      await deleteComment(comment.id).unwrap();
      message.success("Comment deleted successfully.");
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to delete comment.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Comments
          </Title>
          <Text type="secondary">Moderate student comments grouped by video.</Text>
        </div>

        <Input.Search
          allowClear
          placeholder="Search by video name"
          value={searchText}
          onChange={(event) => {
            setPage(1);
            setSearchText(event.target.value);
          }}
        />

        {isFetching ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 100 }}>
            <Spin />
            </div>
        ) : videoGroups.length === 0 ? (
          <Empty description="No comments found." />
        ) : (
          <>
          <Collapse
            items={videoGroups.map((group) => ({
              key: group.videoId,
              label: (
                <div>
                  <Text strong>{group.videoName}</Text>{" "}
                  <Tag icon={<CommentOutlined />}>{group.comments.length}</Tag>
                </div>
              ),
              children: (
                <CommentThread
                  comments={group.comments}
                  onReply={openReplyModal}
                  onDelete={onDeleteComment}
                  deletingId={deletingId}
                />
              ),
            }))}
          />
        <Pagination
          current={page}
          pageSize={limit}
          total={total}
          showSizeChanger
          onChange={(nextPage, nextPageSize) => {
            setPage(nextPage);
            setLimit(nextPageSize);
          }}
          style={{ alignSelf: "flex-end" }}
        />
        </>
        )}

      </div>

      <Modal
        title={`Reply to ${replyModal.username}`}
        open={replyModal.open}
        onCancel={resetReplyModal}
        onOk={() => form.submit()}
        confirmLoading={isReplying}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false} onFinish={onSubmitReply}>
          <Form.Item
            name="message"
            // label="Reply"
            rules={[{ required: true, message: "Reply message is required." }]}
          >
            <Input.TextArea rows={4} placeholder="Write a reply..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
