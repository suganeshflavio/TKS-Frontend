"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Popconfirm,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile, UploadProps } from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FormOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  UploadOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { skipToken } from "@reduxjs/toolkit/query";
import { type CourseItem, useGetCoursesQuery } from "@/store/features/coursesApi";
import {
  type VideoItem,
  useCreateVideoMutation,
  useGetVideoByIdQuery,
  useGetVideoUploadUrlMutation,
  useGetVideosQuery,
  usePermanentDeleteVideoMutation,
  useUpdateVideoMutation,
} from "@/store/features/videosApi";
import { useGetTestsQuery } from "@/store/features/testsApi";
import McqModal from "../modals/McqModal";
import ExistingTestsModal from "../modals/ExistingTestsModal";
import TestAttemptsModal from "../modals/TestAttemptsModal";

const { Title, Text } = Typography;

type VideoFormValues = {
  courseId?: string;
  subject?: string;
  chapter?: string;
  videoName: string;
  youtubeUrl?: string;
  description?: string;
  file?: UploadFile[];
  videoFile?: UploadFile[];
};

const ACCEPTED_FILE_EXTENSIONS = [".ppt", ".pptx", ".pdf"];
const MAX_FILE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 2048;

const beforeUploadFile = (file: File) => {
  const isAccepted = ACCEPTED_FILE_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  if (!isAccepted) {
    message.error("Only .ppt, .pptx, or .pdf files are allowed.");
    return Upload.LIST_IGNORE;
  }

  const isWithinSizeLimit = file.size / 1024 / 1024 <= MAX_FILE_SIZE_MB;

  if (!isWithinSizeLimit) {
    message.error(`File must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
    return Upload.LIST_IGNORE;
  }

  return false;
};

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

const getFileExtension = (value?: string) => {
  if (!value) {
    return "";
  }

  const withoutQueryOrHash = value.toLowerCase().split("?")[0].split("#")[0];
  const lastDot = withoutQueryOrHash.lastIndexOf(".");

  return lastDot === -1 ? "" : withoutQueryOrHash.slice(lastDot);
};

const isPdfFile = (...values: Array<string | undefined>) =>
  values.some((value) => getFileExtension(value) === ".pdf");

const pickCourses = (payload: unknown): CourseItem[] => {
  if (Array.isArray(payload)) {
    return payload as CourseItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const directCandidates = [data.data, data.items, data.results, data.rows, data.courses];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate as CourseItem[];
    }
  }

  if (data.data && typeof data.data === "object") {
    const nested = data.data as Record<string, unknown>;
    const nestedCandidates = [nested.data, nested.items, nested.results, nested.rows, nested.courses];

    for (const candidate of nestedCandidates) {
      if (Array.isArray(candidate)) {
        return candidate as CourseItem[];
      }
    }
  }

  return [];
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
  const [viewFileRecord, setViewFileRecord] = useState<VideoItem | null>(null);
  const [viewVideoRecord, setViewVideoRecord] = useState<VideoItem | null>(null);
  const [McqModalOpen, setMcqModalOpen] = useState(false);
  const [existingTestsOpen, setExistingTestsOpen] = useState(false);
  const [attemptsOpen, setAttemptsOpen] = useState(false);
  const [selectedTestVideo, setSelectedTestVideo] = useState<VideoItem | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | undefined>();
  const [selectedTestName, setSelectedTestName] = useState<string | undefined>();
  const [videoUploadResult, setVideoUploadResult] = useState<{
    videoFileId: string;
    videoFileName: string;
    videoSize?: number;
  } | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const selectedCourseId = Form.useWatch("courseId", form);

  const { data, isFetching, refetch } = useGetVideosQuery({
    page,
    limit,
    search: searchText || undefined,
  });
  const { data: testsData } = useGetTestsQuery({ page: 1, limit: 100 });

  const { data: coursesPayload } = useGetCoursesQuery({ page: 1, limit: 100 });
  const videos = useMemo(() => {
    return pickVideoList(data).filter((video) => {
      const isActive = (video.isActive ?? video.IsActive) !== false;
      return isActive === (statusTab === "active");
    });
  }, [data, statusTab]);
    const courses = useMemo(() => {
      return pickCourses(coursesPayload).filter((course) => {
        const isActive = course.isActive ?? course.IsActive;
        return isActive !== false;
      });
    }, [coursesPayload]);
  const videosWithQuestionTests = useMemo(() => {
    const ids = (testsData?.tests ?? [])
      .filter((test) => (test._count?.questions ?? test.questions?.length ?? 0) > 0)
      .map((test) => test.videoId)
      .filter((videoId): videoId is string => Boolean(videoId));

    return new Set(ids);
  }, [testsData]);
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );
  const subjectOptions = useMemo(
    () => (selectedCourse?.subjects ?? []).map((subject) => ({ label: subject, value: subject })),
    [selectedCourse?.subjects],
  );

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
      courseId: videoDetail.courseId ?? videoDetail.classKey,
      subject: videoDetail.subject,
      chapter: videoDetail.chapter,
      videoName: videoDetail.videoName ?? videoDetail.title ?? "",
      youtubeUrl: videoDetail.youtubeUrl ?? videoDetail.videoUrl,
      description: videoDetail.description,
      file: videoDetail.notesUrl
        ? [
            {
              uid: "-1",
              name: videoDetail.fileName ?? "presentation.pptx",
              status: "done",
              url: videoDetail.notesUrl,
            },
          ]
        : [],
      videoFile: videoDetail.videoFileName
        ? [
            {
              uid: "-2",
              name: videoDetail.videoFileName,
              status: "done",
              url: videoDetail.videoUrl,
            },
          ]
        : [],
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
    const formData = new FormData();

    if (values.courseId) {
      formData.append("courseId", values.courseId);
    }
    if (values.subject?.trim()) {
      formData.append("subject", values.subject.trim());
    }
    if (values.chapter?.trim()) {
      formData.append("chapter", values.chapter.trim());
    }
    formData.append("videoName", values.videoName.trim());
    if (values.youtubeUrl?.trim()) {
      formData.append("youtubeUrl", values.youtubeUrl.trim());
    }
    if (values.description?.trim()) {
      formData.append("description", values.description.trim());
    }

    const uploadedFile = values.file?.[0]?.originFileObj;
    if (uploadedFile) {
      formData.append("notesUrl", uploadedFile);
    }

    if (effectiveVideoUpload) {
      formData.append("videoFileId", effectiveVideoUpload.videoFileId);
      formData.append("videoFileName", effectiveVideoUpload.videoFileName);
      if (effectiveVideoUpload.videoSize !== undefined) {
        formData.append("videoSize", String(effectiveVideoUpload.videoSize));
      }
    }

    try {
      if (editingId) {
        await updateVideo({ id: editingId, body: formData }).unwrap();
        message.success("Video updated successfully.");
      } else {
        await createVideo(formData).unwrap();
        message.success("Video created successfully.");
      }

      resetModal();
      refetch();
    } catch(error:unknown) {
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
        body: {
          courseId: record.courseId ?? record.classKey,
          videoName: record.videoName ?? record.title,
          youtubeUrl: record.youtubeUrl ?? record.videoUrl,
          description: record.description,
          videoFileId: record.videoFileId,
          videoFileName: record.videoFileName,
          isActive: nextActive,
        },
      }).unwrap();
      message.success(`Video ${nextActive ? "unblocked" : "blocked"} successfully.`);
      refetch();
    } catch(error:unknown) {
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
    } catch(error:unknown) {
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

    if (!selectedCourseId) {
      const missingCourseError = new Error("Select a course before uploading a video.");
      onError?.(missingCourseError);
      message.error(missingCourseError.message);
      return;
    }

    try {
      setIsUploadingVideo(true);

      // Step 1: ask the backend for a presigned B2 upload slot.
      const presigned = await getVideoUploadUrl({
        fileName: uploadFile.name,
        courseId: selectedCourseId,
      }).unwrap();

      if (!presigned?.uploadUrl) {
        throw new Error(
          "The server did not return an upload URL. Check the /videos/upload-url response shape.",
        );
      }

      // Step 2: upload the raw file straight to B2 using the returned headers.
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

      // Step 3 (deferred to onSubmit): the create/update video call sends these two values.
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
      title: "Course",
      key: "courseName",
      render: (_, record) => <Text strong>{record.course?.courseName ?? record.courseId ?? record.classKey ?? "-"}</Text>,
    },
    {
      title: "Subject",
      key: "subject",
      render: (_, record) => <Text strong>{record.subject ?? "-"}</Text>
    },
    {
      title: "Chapter / Topic",
      key: "chapter",
      render: (_, record) => (
        <Space size={4} wrap>
          {record.chapter ? <Tag style={{fontWeight:"600"}}>{record.chapter}</Tag> : null}
          {/* {record.topicName ? <Tag color="blue">Topic: {record.topicName}</Tag> : null}
          {!record.chapterName && !record.topicName ? "-" : null} */}
        </Space>
      ),
    },
    {
      title: "Video Name",
      key: "video",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <Text strong>{record.videoName ?? record.title ?? "-"}</Text>
          {/* <Text type="secondary">ID: {record.id}</Text> */}
        </div>
      ),
    },
    // {
    //   title: "Video",
    //   key: "video",
    //   render: (_, record) => (
    //     <Button
    //       icon={<VideoCameraOutlined />}
    //       disabled={!record.videoUrl && !record.youtubeUrl}
    //       onClick={() => setViewVideoRecord(record)}
    //     >
    //       View Video
    //     </Button>
    //   ),
    // },
    {
      title: "Media Files",
      key: "notesUrl",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
        <Button
          icon={<VideoCameraOutlined />}
          size="small"
          disabled={!record.videoUrl && !record.youtubeUrl}
          onClick={() => setViewVideoRecord(record)}
        >
          Video
        </Button>
        <Button
          icon={<FileTextOutlined />}
          size="small"
          disabled={!record.notesUrl}
          onClick={() => setViewFileRecord(record)}
        >
          Notes
        </Button>
        </div>
      ),
    },
    {
      title: "MCQ / Test",
      key: "mcqTest",
      render: (_, record) => {
        const hasQuestionTests = record.id ? videosWithQuestionTests.has(record.id) : false;

        return (
          <Space wrap>
            {!hasQuestionTests ? (
              <Button
                size="small"
                icon={<FormOutlined />}
                onClick={() => {
                  setSelectedTestVideo(record);
                  setMcqModalOpen(true);
                }}
              >
                Create Test
              </Button>
            ) : null}
            <Button
              size="small"
              onClick={() => {
                setSelectedTestVideo(record);
                setExistingTestsOpen(true);
              }}
            >
              Existing Tests
            </Button>
          </Space>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space wrap>
          {/* <Button
            icon={<FileTextOutlined />}
            disabled={!record.notesUrl}
            onClick={() => setViewFileRecord(record)}
          >
            View File
          </Button> */}
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
              okButtonProps={{danger: true, loading: statusUpdatingId === record.id }}
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
              okButtonProps={{danger: true, loading: statusUpdatingId === record.id }}
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
    {McqModalOpen && (
      <McqModal
        open={McqModalOpen}
        videoId={selectedTestVideo?.id}
        videoName={selectedTestVideo?.videoName ?? selectedTestVideo?.title}
        onCancel={() => {
          setMcqModalOpen(false);
          setSelectedTestVideo(null);
        }}
        onSave={() => {
          setMcqModalOpen(false);
          setSelectedTestVideo(null);
        }}
      />
    )}
    <ExistingTestsModal
      open={existingTestsOpen}
      videoId={selectedTestVideo?.id}
      videoName={selectedTestVideo?.videoName ?? selectedTestVideo?.title}
      onViewAttempts={(testId, testName) => {
        setSelectedTestId(testId);
        setSelectedTestName(testName);
        setExistingTestsOpen(false);
        setAttemptsOpen(true);
      }}
      onCancel={() => {
        setExistingTestsOpen(false);
        setSelectedTestVideo(null);
      }}
    />
    <TestAttemptsModal
      open={attemptsOpen}
      testId={selectedTestId}
      testName={selectedTestName}
      onCancel={() => {
        setAttemptsOpen(false);
        setSelectedTestId(undefined);
        setSelectedTestName(undefined);
      }}
    />
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        <Space align="center" style={{ display: "flex", justifyContent: "space-between" }} wrap>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Video List
            </Title>
            <Text type="secondary">Search, paginate, create, and edit videos.</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Add Video
          </Button>
        </Space>

        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search video by name, chapter, or topic"
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
          scroll={{ x: 1100 }}
        />
      </div>

      <Modal
        title={editingId ? "Edit Video" : "Add Video"}
        open={open}
        maskClosable={false}
        width={700}
        // height={500}
        onCancel={resetModal}
        onOk={() => form.submit()}
        confirmLoading={isCreating || isUpdating || isLoadingVideoDetail}
        centered
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false} onFinish={onSubmit}>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <Form.Item name="courseId" label="Course" rules={[{ required: true, message: "Course is required." }]}>
            <Select
              allowClear
              placeholder="Select course"
              options={courses.map((course) => ({
                value: course.id,
                label: course.courseName ?? course.name ?? course.title ?? course.id,
              }))}
              onChange={() => {
                form.setFieldValue("subject", undefined);
              }}
            />
          </Form.Item>

          <Form.Item
          name="subject"
          label="Subject"
        //   rules={[{ required: true, message: "Subject is required." }]}
          >
            <Select
              allowClear
              showSearch
              placeholder={selectedCourse ? "Select subject" : "Select a course first"}
              options={subjectOptions}
              disabled={!selectedCourse}
            />
          </Form.Item>
          </div>
          <Form.Item
          name="chapter"
          label="Chapter"
          // rules={[{ required: true, message: "Chapter is required." }]}
          >
            <Input placeholder="Optional chapter" />
          </Form.Item>

          <Form.Item
            name="videoName"
            label="Video Name"
            rules={[{ required: true, message: "Video name is required." }]}
          >
            <Input placeholder="Example: Algebra Basics" />
          </Form.Item>

          <Form.Item
            name="videoFile"
            label="Video Upload (MP4, max 2 GB)"
            valuePropName="fileList"
            getValueFromEvent={(event) => (Array.isArray(event) ? event : event?.fileList)}
            rules={[
              {
                validator: (_, value) =>
                  Array.isArray(value) && value.length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error("Please upload an MP4 video.")),
              },
            ]}
          >
            <Upload
              accept=".mp4,video/mp4"
              maxCount={1}
              beforeUpload={beforeUploadVideoFile}
              customRequest={handleVideoUploadRequest}
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

          <Form.Item name="youtubeUrl" label="Video URL (optional)">
            <Input placeholder="video URL"/>
          </Form.Item>

          <Form.Item name="description" label="Description" rules={[{ required: true, message: "Description is required." }]}>
            <Input.TextArea rows={4} placeholder="Optional description" />
          </Form.Item>

          <Form.Item
            name="file"
            label="Upload File (PDF, max 10 MB)"
            valuePropName="fileList"
            getValueFromEvent={(event) => (Array.isArray(event) ? event : event?.fileList)}
          >
            <Upload
              accept=".pdf"
              maxCount={1}
              beforeUpload={beforeUploadFile}
            >
              <Button icon={<UploadOutlined />} size="small">Select File</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="View Uploaded File"
        open={!!viewFileRecord}
        onCancel={() => setViewFileRecord(null)}
        footer={<Button onClick={() => setViewFileRecord(null)}>Close</Button>}
        width={800}
        centered
      >
        {viewFileRecord?.notesUrl ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Text strong>{viewFileRecord.notesFileName ?? "Notes file"}</Text>
            <iframe
              src={
                isPdfFile(viewFileRecord.notesFileName, viewFileRecord.fileName, viewFileRecord.notesUrl)
                  ? viewFileRecord.notesUrl
                  : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewFileRecord.notesUrl)}`
              }
              style={{ width: "100%", height: 500, border: "none" }}
              title="Notes preview"
            />
            <a href={viewFileRecord.notesUrl} target="_blank" rel="noopener noreferrer">
              Open / download file
            </a>
          </div>
        ) : (
          <Text type="secondary">No file uploaded for this video.</Text>
        )}
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
            <video
              controls
              src={viewVideoRecord.videoUrl}
              style={{ width: "100%", maxHeight: 500 }}
            />
            <a href={viewVideoRecord.videoUrl} target="_blank" rel="noopener noreferrer">
              Open / download video
            </a>
          </div>
        ) : viewVideoRecord?.youtubeUrl ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Text strong>{viewVideoRecord.videoName ?? viewVideoRecord.title ?? "Video"}</Text>
            <a href={viewVideoRecord.youtubeUrl} target="_blank" rel="noopener noreferrer">
              Open video link
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
