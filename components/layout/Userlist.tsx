"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Tree,
  Space,
  Table,
  Tabs,
  Tag,
  message,
  Typography,
  Select,
} from "antd";
import type { DataNode } from "antd/es/tree";
import type { TreeProps } from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FormOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { type CourseItem, useGetCoursesQuery, useLazyGetCourseByIdQuery } from "@/store/features/coursesApi";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  type UserItem,
  useCreateUserMutation,
  useGetUserByIdQuery,
  useGetUsersQuery,
  usePermanentDeleteUserMutation,
  useUpdateUserMutation,
} from "@/store/features/usersApi";
import {
  type SaveUserAccessCourse,
  type SaveUserAccessRequest,
  useGetUserAccessQuery,
  useSaveUserAccessMutation,
  useUpdateUserAccessMutation,
} from "@/store/features/userAccessApi";
const { Title, Text } = Typography;

type UserFormValues = {
  name: string;
  email: string;
  class?: string;
  mobile?: string;
  role?: string;
  isActive?: boolean;
  password?: string;
  confirmPassword?: string;
};

type UserAccessModalState = {
  open: boolean;
  userId: string | null;
  userName: string;
};

type CourseContent = {
  videos: { id: string; videoName: string }[];
  notes: { id: string; title: string }[];
  mcqTests: { id: string; testName: string }[];
};

type CourseContentMap = Record<string, CourseContent>;

type AccessKind = "video" | "notes" | "test";

const pickUsers = (payload: unknown): UserItem[] => {
  if (Array.isArray(payload)) {
    return payload as UserItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const directCandidates = [data.data, data.items, data.results, data.rows, data.users];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate as UserItem[];
    }
  }

  if (data.data && typeof data.data === "object") {
    const nested = data.data as Record<string, unknown>;
    const nestedCandidates = [nested.data, nested.items, nested.results, nested.rows, nested.users];

    for (const candidate of nestedCandidates) {
      if (Array.isArray(candidate)) {
        return candidate as UserItem[];
      }
    }
  }

  return [];
};

const pickCourses = (payload: unknown): CourseItem[] => {
  if (Array.isArray(payload)) {
    return payload as CourseItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const candidates = [data.data, data.items, data.results, data.rows, data.courses];

  for (const candidate of candidates) {
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

const getCourseName = (course: CourseItem) => course.courseName ?? course.name ?? course.title ?? course.id;

const makeAccessKey = (courseId: string, kind: AccessKind, itemId: string) => [courseId, kind, itemId].join("::");

const isLeafAccessKey = (key: string) => key.split("::").length === 3;

const splitAccessKey = (key: string) => {
  const [courseId = "", kind = "video", itemId = ""] = key.split("::");
  return { courseId, kind: kind as AccessKind, itemId };
};

type SearchableDataNode = DataNode & { searchValue?: string; children?: SearchableDataNode[] };

const filterTreeData = (nodes: SearchableDataNode[], term: string): SearchableDataNode[] => {
  const normalized = term.trim().toLowerCase();

  if (!normalized) {
    return nodes;
  }

  const visit = (node: SearchableDataNode): SearchableDataNode | null => {
    const titleText = String(node.searchValue ?? node.title ?? "").toLowerCase();
    const children = (node.children ?? [])
      .map((child) => visit(child))
      .filter(Boolean) as SearchableDataNode[];

    if (titleText.includes(normalized) || children.length > 0) {
      return {
        ...node,
        children,
      };
    }

    return null;
  };

  return nodes.map((node) => visit(node)).filter(Boolean) as SearchableDataNode[];
};

export default function Userlist() {
  const [form] = Form.useForm<UserFormValues>();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<"active" | "blocked">("active");
  const [accessModal, setAccessModal] = useState<UserAccessModalState>({
    open: false,
    userId: null,
    userName: "",
  });
  const [accessSearchText, setAccessSearchText] = useState("");
  const [checkedAccessKeys, setCheckedAccessKeys] = useState<string[]>([]);
  const [isAccessDirty, setIsAccessDirty] = useState(false);
  const [courseContentMap, setCourseContentMap] = useState<CourseContentMap>({});
  const [isLoadingCourseContent, setIsLoadingCourseContent] = useState(false);

  const { data, isFetching, refetch } = useGetUsersQuery({
    page,
    limit,
    search: searchText || undefined,
  });

  const userDetailArgs = editingId ?? skipToken;
  const { data: userDetail, isFetching: isLoadingUserDetail } = useGetUserByIdQuery(userDetailArgs);

  const accessUserId = accessModal.open ? accessModal.userId ?? skipToken : skipToken;
  const { data: accessDetail, isFetching: isLoadingAccessDetail } = useGetUserAccessQuery(accessUserId);

  const { data: coursesPayload } = useGetCoursesQuery({ page: 1, limit: 1000 });
  const [fetchCourseById] = useLazyGetCourseByIdQuery();

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [permanentDeleteUser] = usePermanentDeleteUserMutation();
  const [saveUserAccess, { isLoading: isSavingAccess }] = useSaveUserAccessMutation();
  const [updateUserAccess, { isLoading: isUpdatingAccess }] = useUpdateUserAccessMutation();

  const users = useMemo(() => {
    return pickUsers(data).filter((user) => {
      const role = (user.role ?? user.Role ?? "").toLowerCase();
      const isActive = (user.isActive ?? user.IsActive) !== false;
      return role === "student" && isActive === (statusTab === "active");
    });
  }, [data, statusTab]);
  const total = useMemo(() => users.length, [users.length]);

  const courses = useMemo(() => {
    return pickCourses(coursesPayload).filter((course) => {
      const isActive = course.isActive ?? course.IsActive;
      return isActive !== false;
    });
  }, [coursesPayload]);

  // Load each active course's linked videos/notes/mcq tests when the access modal opens.
  useEffect(() => {
    if (!accessModal.open || courses.length === 0) {
      return;
    }

    let cancelled = false;

    const loadAll = async () => {
      setIsLoadingCourseContent(true);

      try {
        const entries = await Promise.all(
          courses.map(async (course) => {
            const detail = await fetchCourseById(course.id).unwrap();

            const videos = (detail.videos ?? [])
              .filter((item) => item.isActive !== false && item.video?.isActive !== false)
              .map((item) => ({ id: item.video.id, videoName: item.video.videoName }));

            const notes = (detail.notes ?? [])
              .filter((item) => item.isActive !== false && item.notes?.isActive !== false)
              .map((item) => ({ id: item.notes.id, title: item.notes.title }));

            const mcqTests = (detail.mcqTests ?? [])
              .filter((item) => item.isActive !== false)
              .map((item) => ({ id: item.test.id, testName: item.test.testName }));

            const content: CourseContent = { videos, notes, mcqTests };
            return [course.id, content] as const;
          }),
        );

        if (!cancelled) {
          setCourseContentMap(Object.fromEntries(entries));
        }
      } catch (error: unknown) {
        if (!cancelled) {
          message.error((error as Error)?.message || "Unable to load course content.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCourseContent(false);
        }
      }
    };

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, [accessModal.open, courses, fetchCourseById]);

  const accessTreeData = useMemo(() => {
    const tree: SearchableDataNode[] = courses.map((course) => {
      const courseName = getCourseName(course);
      const content = courseContentMap[course.id] ?? { videos: [], notes: [], mcqTests: [] };

      const categories: SearchableDataNode[] = [
        {
          title: (
            <span>
              <VideoCameraOutlined style={{ color: "#1677ff", marginRight: 6 }} />
              Videos ({content.videos.length})
            </span>
          ),
          searchValue: "videos",
          key: `${course.id}::video`,
          children: content.videos.map((video) => ({
            title: <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{video.videoName}</span>,
            searchValue: video.videoName,
            key: makeAccessKey(course.id, "video", video.id),
          })),
        },
        {
          title: (
            <span>
              <FileTextOutlined style={{ color: "#52c41a", marginRight: 6 }} />
              Notes ({content.notes.length})
            </span>
          ),
          searchValue: "notes",
          key: `${course.id}::notes`,
          children: content.notes.map((note) => ({
            title: <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{note.title}</span>,
            searchValue: note.title,
            key: makeAccessKey(course.id, "notes", note.id),
          })),
        },
        {
          title: (
            <span>
              <FormOutlined style={{ color: "#fa8c16", marginRight: 6 }} />
              MCQ Tests ({content.mcqTests.length})
            </span>
          ),
          searchValue: "mcq tests",
          key: `${course.id}::test`,
          children: content.mcqTests.map((test) => ({
            title: <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{test.testName}</span>,
            searchValue: test.testName,
            key: makeAccessKey(course.id, "test", test.id),
          })),
        },
      ];

      return {
        title: <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{courseName}</span>,
        searchValue: courseName,
        key: course.id,
        children: categories,
      };
    });

    return filterTreeData(tree, accessSearchText);
  }, [accessSearchText, courseContentMap, courses]);

  useEffect(() => {
    if (!userDetail || !editingId) {
      return;
    }

    const userRole = (userDetail.role ?? userDetail.Role ?? "").toLowerCase();
    const isActive = userDetail.isActive ?? userDetail.IsActive;

    form.setFieldsValue({
      name: userDetail.name ?? "",
      email: userDetail.email ?? "",
      class: userDetail.class ?? "",
      mobile: userDetail.mobile,
      role: userRole,
      isActive,
      password: undefined,
      confirmPassword: undefined,
    });
  }, [editingId, form, userDetail]);

  const initialAccessKeys = useMemo(() => {
    const keys: string[] = [];

    for (const course of accessDetail?.courses ?? []) {
      if (!course.courseId) {
        continue;
      }

      for (const video of course.videos ?? []) {
        if (video.videoId) {
          keys.push(makeAccessKey(course.courseId, "video", video.videoId));
        }
      }

      for (const note of course.notes ?? []) {
        if (note.notesId) {
          keys.push(makeAccessKey(course.courseId, "notes", note.notesId));
        }
      }

      for (const test of course.mcqTests ?? []) {
        if (test.testId) {
          keys.push(makeAccessKey(course.courseId, "test", test.testId));
        }
      }
    }

    return keys;
  }, [accessDetail]);

  const hasExistingAccess = initialAccessKeys.length > 0;

  const effectiveCheckedAccessKeys = isAccessDirty ? checkedAccessKeys : initialAccessKeys;

  const resetModal = () => {
    setOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const onSubmit = async (values: UserFormValues) => {
    const payload: Partial<UserItem> = {
      name: values.name.trim(),
      email: values.email.trim(),
      class: values.class?.trim(),
      mobile: values.mobile?.trim(),
    };

    if (values.password) {
      payload.password = values.password;
    }

    try {
      if (editingId) {
        await updateUser({ id: editingId, body: payload }).unwrap();
        message.success("User updated successfully.");
      } else {
        await createUser(payload).unwrap();
        message.success("User created successfully.");
      }

      resetModal();
      refetch();
    } catch(error:unknown) {
      message.error((error as Error)?.message || "Unable to save user.");
    }
  };

  const onToggleUserBlocked = async (record: UserItem) => {
    const id = record.id;
    const nextActive = !((record.isActive ?? record.IsActive) !== false);

    try {
      setStatusUpdatingId(id);
      await updateUser({ id, body: { isActive: nextActive } }).unwrap();
      message.success(`User ${nextActive ? "unblocked" : "blocked"} successfully.`);
      refetch();
    } catch(error:unknown) {
      message.error((error as Error)?.message || "Unable to update user status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const onDeleteUser = async (id: string) => {
    try {
      setDeletingId(id);
      await permanentDeleteUser(id).unwrap();
      message.success("User deleted successfully.");
      refetch();
    } catch(error:unknown) {
      message.error((error as Error)?.message || "Unable to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  const openAccessModal = (user: UserItem) => {
    setAccessModal({
      open: true,
      userId: user.id,
      userName: user.name ?? user.email ?? user.id,
    });
    setAccessSearchText("");
    setCheckedAccessKeys([]);
    setIsAccessDirty(false);
    setCourseContentMap({});
  };

  const resetAccessModal = () => {
    setAccessModal({ open: false, userId: null, userName: "" });
    setAccessSearchText("");
    setCheckedAccessKeys([]);
    setIsAccessDirty(false);
    setCourseContentMap({});
  };

  const onSaveAccess = async () => {
    if (!accessModal.userId) {
      return;
    }

    const flatAccesses = Array.from(new Set(effectiveCheckedAccessKeys))
      .filter(isLeafAccessKey)
      .map((key) => splitAccessKey(key));

    const courseMap = new Map<string, { videoIds: Set<string>; notesIds: Set<string>; testIds: Set<string> }>();

    for (const { courseId, kind, itemId } of flatAccesses) {
      const entry = courseMap.get(courseId) ?? {
        videoIds: new Set<string>(),
        notesIds: new Set<string>(),
        testIds: new Set<string>(),
      };
      courseMap.set(courseId, entry);

      if (kind === "video") entry.videoIds.add(itemId);
      else if (kind === "notes") entry.notesIds.add(itemId);
      else if (kind === "test") entry.testIds.add(itemId);
    }

    const coursesPayload: SaveUserAccessCourse[] = Array.from(courseMap.entries()).map(
      ([courseId, entry]) => ({
        courseId,
        videoIds: Array.from(entry.videoIds),
        notesIds: Array.from(entry.notesIds),
        testIds: Array.from(entry.testIds),
      }),
    );

    const body: SaveUserAccessRequest = {
      userId: accessModal.userId,
      courses: coursesPayload,
    };

    try {
      if (hasExistingAccess) {
        await updateUserAccess(body).unwrap();
      } else {
        await saveUserAccess(body).unwrap();
      }

      message.success("User access updated successfully.");
      resetAccessModal();
      refetch();
    } catch(error:unknown) {
      message.error((error as Error)?.message || "Unable to save user access.");
    }
  };

  const onTreeCheck: TreeProps["onCheck"] = (keys) => {
    if (Array.isArray(keys)) {
      setIsAccessDirty(true);
      setCheckedAccessKeys(keys as string[]);
      return;
    }

    setIsAccessDirty(true);
    setCheckedAccessKeys(keys.checked as string[]);
  };

  const columns: ColumnsType<UserItem> = [
    {
      title: "User Info",
      key: "user",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <Text strong>{record.name ?? "-"}</Text>
          <Text type="secondary">{record.email ?? "-"}</Text>
          <Text type="secondary">+91 {record.mobile ?? "-"}</Text>
        </div>
      ),
    },
    {
      title: "Class",
      key: "class",
      render: (_, record) => <Tag>{record.class ?? "-"}</Tag>,
    },
    {
      title: "Course Access",
      key: "class",
      render: (_, record) => (
      <Button
            icon={record.isAccess ? <EyeOutlined /> : <PlusOutlined />}
            variant="outlined"
            size="small"
            onClick={() => openAccessModal(record)}
          >
            {record.isAccess ? "View Course" : "Add Course"}
          </Button>
      )
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space wrap>
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
              title="Block this user?"
              okText="Block"
              cancelText="Cancel"
              okButtonProps={{danger: true, loading: statusUpdatingId === record.id }}
              onConfirm={() => onToggleUserBlocked(record)}
            >
              <Button icon={<StopOutlined />} size="small" color="danger" variant="filled" loading={statusUpdatingId === record.id}>
                Block
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Unblock this user?"
              okText="Unblock"
              cancelText="Cancel"
              okButtonProps={{danger: true, loading: statusUpdatingId === record.id }}
              onConfirm={() => onToggleUserBlocked(record)}
            >
              <Button icon={<CheckCircleOutlined />} size="small" color="danger" variant="filled" loading={statusUpdatingId === record.id}>
                Unblock
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete this user?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => onDeleteUser(record.id)}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small" color="danger" variant="outlined"
              loading={deletingId === record.id}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        <Space align="center" style={{ display: "flex", justifyContent: "space-between" }} wrap>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Users List
            </Title>
            <Text type="secondary">Search, paginate, create, and edit users.</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Add User
          </Button>
        </Space>

        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search user by name or email"
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
          dataSource={users}
          loading={isFetching}
          size="small"
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
          scroll={{ x: 1200 }}
        />
      </div>

      <Modal
        title={editingId ? "Edit User" : "Add User"}
        open={open}
        maskClosable={false}
        onCancel={resetModal}
        onOk={() => form.submit()}
        confirmLoading={isCreating || isUpdating || isLoadingUserDetail}
        centered
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false} onFinish={onSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required." }]}>
            <Input placeholder="Enter name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required." },
              { type: "email", message: "Please enter a valid email." },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item name="mobile" label="Phone" rules={[{ required: true, message: "Phone is required." }, { pattern: /^\d{10}$/, message: "Please enter a valid 10-digit phone number." }]}>
            <Input placeholder="Optional phone" />
          </Form.Item>

          <Form.Item name="class" label="Class" rules={[{ required: true, message: "Class is required." }]}>
            <Select
              allowClear
              options={[
                { label: "10th", value: "10th" },
                { label: "11th", value: "11th" },
                { label: "12th", value: "12th" },
                { label: "Neet Student", value: "NEET" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingId ? "New Password" : "Password"}
            rules={editingId ? [] : [{ required: true, message: "Password is required." }]}
          >
            <Input.Password placeholder={editingId ? "Optional new password" : "Enter password"} />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={editingId ? "Confirm New Password" : "Confirm Password"}
            dependencies={["password"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const password = getFieldValue("password");

                  if (!password && !value) {
                    return Promise.resolve();
                  }

                  if (password === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error("Password and confirm password must match."));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Re-enter password" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Assign Access - ${accessModal.userName}`}
        open={accessModal.open}
        onCancel={resetAccessModal}
        onOk={onSaveAccess}
        okText="Assign Access"
        confirmLoading={isLoadingAccessDetail || isLoadingCourseContent || isSavingAccess || isUpdatingAccess}
        width="min(900px, 96vw)"
        style={{ top: 16 }}
        destroyOnHidden
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Input.Search
            allowClear
            placeholder="Search course or video"
            value={accessSearchText}
            onChange={(event) => setAccessSearchText(event.target.value)}
          />

          <div
            style={{
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              padding: 12,
              maxHeight: "60vh",
              overflow: "auto",
            }}
          >
            <Tree
              checkable
              checkedKeys={effectiveCheckedAccessKeys}
              onCheck={onTreeCheck}
              treeData={accessTreeData}
              defaultExpandAll
              selectable={false}
              showLine
            />
            {!isLoadingAccessDetail && !isLoadingCourseContent && accessTreeData.length === 0 ? (
              <Text type="secondary">No courses available.</Text>
            ) : null}
          </div>
        </Space>
      </Modal>
    </Card>
  );
}
