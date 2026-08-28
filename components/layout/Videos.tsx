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
import type { UploadProps } from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  type VideoItem,
  useCreateVideoMutation,
  useGetVideoByIdQuery,
  useGetVideoUploadUrlMutation,
  useGetVideosQuery,
  usePermanentDeleteVideoMutation,
  useUpdateVideoMutation,
} from "@/store/features/videosApi";
import LinkToTopicModal from "../modals/LinkToTopicModal";

const { Title, Text } = Typography;

type VideoFormValues = {
  videoName: string;
  description?: string;
  duration?: string;
};

const MAX_VIDEO_SIZE_MB = 2048;

const beforeUploadVideoFile = (file: File) => {
  const isMp4 = file.name.toLowerCase().endsWith(".mp4") || file.type === "video/mp4";

  if (!isMp4) {
    message.error("Only .mp4 files are allowed.");
    return Upload.LIST_IGNORE;
  }

  const isWithinSizeLimit = file.size / 1024 / 1024 <= MAX_VIDEO_SIZE_MB;

  if (!isWithinSizeLimit) {
    message.error(`Video must be smaller than ${MAX_VIDEO_SIZE_MB} MB.`);
    return Upload.LIST_IGNORE;
  }

  return true;
};

const pickVideoList = (payload: unknown): VideoItem[] => {
  if (Array.isArray(payload)) {
    return payload as VideoItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const directCandidates = [data.data, data.items, data.results, data.rows, data.videos];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate as VideoItem[];
    }
  }

  if (data.data && typeof data.data === "object") {
    const nested = data.data as Record<string, unknown>;
    const nestedCandidates = [nested.data, nested.items, nested.results, nested.rows, nested.videos];

    for (const candidate of nestedCandidates) {
      if (Array.isArray(candidate)) {
        return candidate as VideoItem[];
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

export default function Videos() {
  const [form] = Form.useForm<VideoFormValues>();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<"active" | "blocked">("active");
  const [viewVideoRecord, setViewVideoRecord] = useState<VideoItem | null>(null);
  const [linkTopicVideo, setLinkTopicVideo] = useState<VideoItem | null>(null);
  const [videoUploadResult, setVideoUploadResult] = useState<{
    videoFileId: string;
    videoFileName: string;
    videoSize?: number;
  } | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const { data, isFetching, refetch } = useGetVideosQuery({
    page,
    limit,
    search: searchText || undefined,
  });

  const videos = useMemo(() => {
    return pickVideoList(data).filter((video) => {
      const isActive = (video.isActive ?? video.IsActive) !== false;
      return isActive === (statusTab === "active");
    });
  }, [data, statusTab]);

  const videoDetailArgs = editingId ?? skipToken;
  const { data: videoDetail, isFetching: isLoadingVideoDetail } = useGetVideoByIdQuery(videoDetailArgs);

  const [createVideo, { isLoading: isCreating }] = useCreateVideoMutation();
  const [updateVideo, { isLoading: isUpdating }] = useUpdateVideoMutation();
  const [permanentDeleteVideo] = usePermanentDeleteVideoMutation();
  const [getVideoUploadUrl] = useGetVideoUploadUrlMutation();

  const total = useMemo(() => pickTotal(data, videos.length), [data, videos.length]);

  useEffect(() => {
    if (!videoDetail || !editingId) {
      return;
    }

    form.setFieldsValue({
      videoName: videoDetail.videoName ?? videoDetail.title ?? "",
      description: videoDetail.description,
      duration: videoDetail.duration,
    });
  }, [editingId, form, videoDetail]);

  const existingVideoUpload = useMemo(() => {
    if (!editingId || !videoDetail?.videoFileId || !videoDetail?.videoFileName) {
      return null;
    }

    return {
      videoFileId: videoDetail.videoFileId,
      videoFileName: videoDetail.videoFileName,
      videoSize: videoDetail.videoSize,
    };
  }, [editingId, videoDetail]);

  const [videoFileRemoved, setVideoFileRemoved] = useState(false);
  const effectiveVideoUpload = videoUploadResult ?? (videoFileRemoved ? null : existingVideoUpload);

  const resetModal = () => {
    setOpen(false);
    setEditingId(null);
    setVideoUploadResult(null);
    setVideoFileRemoved(false);
    form.resetFields();
  };

  const onSubmit = async (values: VideoFormValues) => {
    if (!effectiveVideoUpload) {
      message.error("Upload an MP4 file before saving.");
      return;
    }

    const body: Partial<VideoItem> = {
      videoName: values.videoName.trim(),
      description: values.description?.trim(),
      duration: values.duration?.trim(),
      videoFileId: effectiveVideoUpload.videoFileId,
      videoFileName: effectiveVideoUpload.videoFileName,
      videoSize: effectiveVideoUpload.videoSize,
    };

    try {
      if (editingId) {
        await updateVideo({ id: editingId, body }).unwrap();
        message.success("Video updated successfully.");
      } else {
        await createVideo(body).unwrap();
        message.success("Video created successfully.");
      }

      resetModal();
      refetch();
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to save video.");
    }
  };

  const onToggleVideoBlocked = async (record: VideoItem) => {
    const id = record.id;
    const nextActive = !((record.isActive ?? record.IsActive) !== false);

    try {
      setStatusUpdatingId(id);
      await updateVideo({
        id,
        body: { isActive: nextActive },
      }).unwrap();
      message.success(`Video ${nextActive ? "unblocked" : "blocked"} successfully.`);
      refetch();
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to update video status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const onDeleteVideo = async (record: VideoItem) => {
    const id = record.id;

    try {
      setDeletingId(id);
      await permanentDeleteVideo(id).unwrap();
      message.success("Video deleted successfully.");
      refetch();
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to delete video.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleVideoUploadRequest: NonNullable<UploadProps["customRequest"]> = async ({
    file,
    onProgress,
    onSuccess,
    onError,
  }) => {
    const uploadFile = file as File;

    try {
      setIsUploadingVideo(true);

      const presigned = await getVideoUploadUrl({ fileName: uploadFile.name }).unwrap();

      if (!presigned?.uploadUrl) {
        throw new Error(
          "The server did not return an upload URL. Check the /videos/upload-url response shape.",
        );
      }

      const b2Response = await new Promise<{ fileId: string; contentLength: number }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", presigned.uploadUrl);

          Object.entries(presigned.headers ?? {}).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              onProgress?.({ percent: (event.loaded / event.total) * 100 });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error("Unexpected response from storage upload."));
              }
            } else {
              reject(new Error("Upload failed."));
            }
          };
          xhr.onerror = () => reject(new Error("Upload failed."));
          xhr.send(uploadFile);
        },
      );

      setVideoUploadResult({
        videoFileId: b2Response.fileId,
        videoFileName: presigned.fileName,
        videoSize: b2Response.contentLength,
      });
      onSuccess?.(b2Response);
      message.success("Video uploaded successfully.");
    } catch (error: unknown) {
      onError?.(error as Error);
      message.error((error as Error)?.message || "Unable to upload video.");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const columns: ColumnsType<VideoItem> = [
    {
      title: "Video Name",
      key: "video",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <Text strong>{record.videoName ?? record.title ?? "-"}</Text>
        </div>
      ),
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
      title: "Media",
      key: "media",
      render: (_, record) => (
        <Button
          icon={<VideoCameraOutlined />}
          size="small"
          disabled={!record.videoUrl}
          onClick={() => setViewVideoRecord(record)}
        >
          Video
        </Button>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space wrap>
          <Button
            icon={<LinkOutlined />}
            size="small"
            onClick={() => setLinkTopicVideo(record)}
          >
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
              title="Block this video?"
              okText="Block"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: statusUpdatingId === record.id }}
              onConfirm={() => onToggleVideoBlocked(record)}
            >
              <Button icon={<StopOutlined />} size="small" color="danger" variant="filled" loading={statusUpdatingId === record.id}>
                Block
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Unblock this video?"
              okText="Unblock"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: statusUpdatingId === record.id }}
              onConfirm={() => onToggleVideoBlocked(record)}
            >
              <Button icon={<CheckCircleOutlined />} color="danger" variant="filled" loading={statusUpdatingId === record.id}>
                Unblock
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete this video?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => onDeleteVideo(record)}
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
        open={!!linkTopicVideo}
        kind="video"
        entityId={linkTopicVideo?.id}
        entityLabel={linkTopicVideo?.videoName}
        onClose={() => setLinkTopicVideo(null)}
      />
      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          <Space align="center" style={{ display: "flex", justifyContent: "space-between" }} wrap>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Video Library
              </Title>
              <Text type="secondary">
                Create videos here, then link them to a Topic in Curriculum or to a Course.
              </Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              Add Video
            </Button>
          </Space>

          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search video by name"
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
            dataSource={videos}
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
          title={editingId ? "Edit Video" : "Add Video"}
          open={open}
          maskClosable={false}
          width={600}
          onCancel={resetModal}
          onOk={() => form.submit()}
          confirmLoading={isCreating || isUpdating || isLoadingVideoDetail}
          centered
          destroyOnHidden
        >
          <Form form={form} layout="vertical" requiredMark={false} onFinish={onSubmit}>
            <Form.Item
              name="videoName"
              label="Video Name"
              rules={[{ required: true, message: "Video name is required." }]}
            >
              <Input placeholder="Example: Intro to Quadratics" />
            </Form.Item>

            <Form.Item label="Video Upload (MP4, max 2 GB)" required>
              <Upload
                accept=".mp4,video/mp4"
                maxCount={1}
                beforeUpload={beforeUploadVideoFile}
                customRequest={handleVideoUploadRequest}
                defaultFileList={
                  existingVideoUpload
                    ? [
                        {
                          uid: "-2",
                          name: existingVideoUpload.videoFileName,
                          status: "done",
                        },
                      ]
                    : []
                }
                onRemove={() => {
                  setVideoUploadResult(null);
                  setVideoFileRemoved(true);
                }}
              >
                <Button icon={<VideoCameraOutlined />} size="small" loading={isUploadingVideo}>
                  {isUploadingVideo ? "Uploading..." : "Select MP4"}
                </Button>
              </Upload>
            </Form.Item>

            <Form.Item name="duration" label="Duration (optional)">
              <Input placeholder="Example: 12:04" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <Input.TextArea rows={4} placeholder="Optional description" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="View Video"
          open={!!viewVideoRecord}
          onCancel={() => setViewVideoRecord(null)}
          footer={<Button onClick={() => setViewVideoRecord(null)}>Close</Button>}
          width={800}
          destroyOnHidden
        >
          {viewVideoRecord?.videoUrl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Text strong>{viewVideoRecord.videoName ?? viewVideoRecord.title ?? "Video"}</Text>
              <video controls src={viewVideoRecord.videoUrl} style={{ width: "100%", maxHeight: 500 }} />
              <a href={viewVideoRecord.videoUrl} target="_blank" rel="noopener noreferrer">
                Open / download video
              </a>
            </div>
          ) : (
            <Text type="secondary">No video uploaded for this record.</Text>
          )}
        </Modal>
      </Card>
    </>
  );
}
