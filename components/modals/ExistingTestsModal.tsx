"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import {
  type TestItem,
  type TestQuestion,
  useAddQuestionMutation,
  useDeleteQuestionMutation,
  useDeleteTestMutation,
  useGetTestByIdQuery,
  useGetTestsQuery,
  useUpdateQuestionMutation,
  useUpdateTestMutation,
} from "@/store/features/testsApi";
import { skipToken } from "@reduxjs/toolkit/query";

const { Text, Title } = Typography;

interface Props {
  readonly open: boolean;
  readonly onCancel: () => void;
  readonly videoId?: string;
  readonly videoName?: string;
  readonly onViewAttempts?: (testId?: string, testName?: string) => void;
}

type TestCardProps = {
  readonly test: TestItem;
  readonly onDeleteTest: (testId: string) => Promise<void>;
  readonly onViewAttempts?: (testId?: string, testName?: string) => void;
  readonly onRefresh: () => Promise<void>;
};

function TestCard({
  test,
  onDeleteTest,
  onViewAttempts,
  onRefresh,
}: TestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingTest, setEditingTest] = useState(false);
  const [draftTestName, setDraftTestName] = useState(test.testName ?? "");
  const [draftMarks, setDraftMarks] = useState(test.marksPerQuestion ?? 1);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [draftQuestion, setDraftQuestion] =
    useState<Partial<TestQuestion> | null>(null);

  const [updateTest, { isLoading: isUpdatingTest }] = useUpdateTestMutation();
  const [addQuestion, { isLoading: isAddingQuestion }] =
    useAddQuestionMutation();
  const [updateQuestion, { isLoading: isUpdatingQuestion }] =
    useUpdateQuestionMutation();
  const [deleteQuestion, { isLoading: isDeletingQuestion }] =
    useDeleteQuestionMutation();
  const [deleteTest, { isLoading: isDeletingTest }] = useDeleteTestMutation();
  const {
    data: fullTest,
    refetch: refetchTest,
    isFetching: isFetchingQuestions,
  } = useGetTestByIdQuery(test.id, { skip: !expanded || !test.id });
  const detailQuestions = useMemo(() => fullTest?.questions ?? [], [fullTest]);

  useEffect(() => {
    setDraftTestName(test.testName ?? "");
    setDraftMarks(test.marksPerQuestion ?? 1);
    setEditingTest(false);
    setEditingQuestionId(null);
    setDraftQuestion(null);
  }, [test.id, test.testName, test.marksPerQuestion]);

  const handleSaveTest = async () => {
    const trimmedName = draftTestName.trim();
    if (!trimmedName) {
      message.error("Enter a test name before saving.");
      return;
    }

    try {
      await updateTest({
        id: test.id,
        body: {
          testName: trimmedName,
          marksPerQuestion: draftMarks,
        },
      }).unwrap();

      message.success("Test updated successfully.");
      setEditingTest(false);
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to update test.");
    }
  };

  const handleAddQuestion = async () => {
    try {
      await addQuestion({
        id: test.id,
        body: {
          question: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctOption: "A",
          explanation: "",
        },
      }).unwrap();

      await refetchTest();
      await onRefresh();
      message.success("New question added.");
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to add question.");
    }
  };

  const handleDeleteQuestion = async (question: TestQuestion) => {
    if (!question.id) {
      message.error("This question cannot be deleted because it has no id.");
      return;
    }

    try {
      await deleteQuestion({ id: test.id, questionId: question.id }).unwrap();
      await refetchTest();
      await onRefresh();
      message.success("Question deleted successfully.");
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to delete question.");
    }
  };

  const handleSaveQuestion = async () => {
    if (!draftQuestion?.question?.trim()) {
      message.error("Enter the question text before saving.");
      return;
    }

    if (!editingQuestionId) {
      return;
    }

    try {
      await updateQuestion({
        id: test.id,
        questionId: editingQuestionId,
        body: {
          question: draftQuestion.question?.trim(),
          optionA: draftQuestion.optionA?.trim(),
          optionB: draftQuestion.optionB?.trim(),
          optionC: draftQuestion.optionC?.trim(),
          optionD: draftQuestion.optionD?.trim(),
          correctOption: draftQuestion.correctOption?.trim(),
          explanation: draftQuestion.explanation?.trim(),
        },
      }).unwrap();

      message.success("Question updated successfully.");
      await refetchTest();
      await onRefresh();
      setEditingQuestionId(null);
      setDraftQuestion(null);
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to update question.");
    }
  };

  return (
    <Card size="small">
      <Space
        align="center"
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}
        wrap
      >
        <div>
          <Title level={5} style={{ marginBottom: 4 }}>
            {test.testName ?? "Untitled Test"}
          </Title>
          <Text type="secondary">
            Questions: {test._count?.questions ?? test.questions?.length ?? 0} •
            Marks: {test.marksPerQuestion ?? 1}
          </Text>
          <div style={{ marginTop: 8 }}>
            <Tag color="blue">{test._count?.attempts ?? 0} attempts</Tag>
          </div>
        </div>
        <Space>
          <Button size="small" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? "Hide" : "View"}
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewAttempts?.(test.id, test.testName)}
          >
            Attempts
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            loading={isDeletingTest}
            onClick={() => onDeleteTest(test.id)}
          >
            Delete Test
          </Button>
        </Space>
      </Space>

      {expanded ? (
        <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
          <Card size="small">
            <Space
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
              align="center"
              wrap
            >
              <Text strong>Test details</Text>
              {!editingTest ? (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setEditingTest(true)}
                >
                  Edit Test
                </Button>
              ) : null}
            </Space>

            {editingTest ? (
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <Input
                  value={draftTestName}
                  onChange={(event) => setDraftTestName(event.target.value)}
                  placeholder="Test name"
                />
                <InputNumber
                  min={1}
                  value={draftMarks}
                  onChange={(value) => setDraftMarks(Number(value ?? 1))}
                  style={{ width: "100%" }}
                />
                <Space>
                  <Button onClick={() => setEditingTest(false)}>Cancel</Button>
                  <Button
                    type="primary"
                    loading={isUpdatingTest}
                    onClick={() => void handleSaveTest()}
                  >
                    Save Test
                  </Button>
                </Space>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <Text>{test.testName ?? "Untitled Test"}</Text>
                <div>
                  <Text type="secondary">
                    Marks per question: {test.marksPerQuestion ?? 1}
                  </Text>
                </div>
              </div>
            )}
          </Card>

          <Card size="small">
            <Space
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
              align="center"
              wrap
            >
              <Text strong>Questions</Text>
              {/* <Button type="dashed" onClick={() => void handleAddQuestion()} loading={isAddingQuestion}>
                Add Question
              </Button> */}
            </Space>
            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {isFetchingQuestions ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 80,
                  }}
                >
                  <Spin />
                </div>
              ) : detailQuestions.length === 0 ? (
                <Text type="secondary">No questions yet.</Text>
              ) : (
                detailQuestions.map((question) => (
                  <div
                    key={question.id ?? `${test.id}-${question.question}`}
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    {editingQuestionId === question.id ? (
                      <div style={{ display: "grid", gap: 12 }}>
                        <Input.TextArea
                          rows={2}
                          value={draftQuestion?.question ?? ""}
                          onChange={(event) =>
                            setDraftQuestion((prev) => ({
                              ...(prev ?? {}),
                              question: event.target.value,
                            }))
                          }
                          placeholder="Question"
                        />
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(200px, 1fr))",
                          }}
                        >
                          <Input
                            value={draftQuestion?.optionA ?? ""}
                            onChange={(event) =>
                              setDraftQuestion((prev) => ({
                                ...(prev ?? {}),
                                optionA: event.target.value,
                              }))
                            }
                            placeholder="Option A"
                          />
                          <Input
                            value={draftQuestion?.optionB ?? ""}
                            onChange={(event) =>
                              setDraftQuestion((prev) => ({
                                ...(prev ?? {}),
                                optionB: event.target.value,
                              }))
                            }
                            placeholder="Option B"
                          />
                          <Input
                            value={draftQuestion?.optionC ?? ""}
                            onChange={(event) =>
                              setDraftQuestion((prev) => ({
                                ...(prev ?? {}),
                                optionC: event.target.value,
                              }))
                            }
                            placeholder="Option C"
                          />
                          <Input
                            value={draftQuestion?.optionD ?? ""}
                            onChange={(event) =>
                              setDraftQuestion((prev) => ({
                                ...(prev ?? {}),
                                optionD: event.target.value,
                              }))
                            }
                            placeholder="Option D"
                          />
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(200px, 1fr))",
                          }}
                        >
                          <Select
                            value={draftQuestion?.correctOption ?? "A"}
                            options={[
                              { label: "A", value: "A" },
                              { label: "B", value: "B" },
                              { label: "C", value: "C" },
                              { label: "D", value: "D" },
                            ]}
                            onChange={(value) =>
                              setDraftQuestion((prev) => ({
                                ...(prev ?? {}),
                                correctOption: value,
                              }))
                            }
                          />
                          <Input.TextArea
                            rows={2}
                            value={draftQuestion?.explanation ?? ""}
                            onChange={(event) =>
                              setDraftQuestion((prev) => ({
                                ...(prev ?? {}),
                                explanation: event.target.value,
                              }))
                            }
                            placeholder="Explanation"
                          />
                        </div>
                        <Space>
                          <Button
                            onClick={() => {
                              setEditingQuestionId(null);
                              setDraftQuestion(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="primary"
                            loading={isUpdatingQuestion}
                            onClick={() => void handleSaveQuestion()}
                          >
                            Save Question
                          </Button>
                        </Space>
                      </div>
                    ) : (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Text strong>
                            {question.question ?? "Untitled question"}
                          </Text>
                          <Space>
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => {
                                setEditingQuestionId(question.id ?? null);
                                setDraftQuestion({
                                  question: question.question,
                                  optionA: question.optionA,
                                  optionB: question.optionB,
                                  optionC: question.optionC,
                                  optionD: question.optionD,
                                  correctOption: question.correctOption,
                                  explanation: question.explanation,
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              loading={isDeletingQuestion}
                              onClick={() =>
                                void handleDeleteQuestion(question)
                              }
                            >
                              Delete
                            </Button>
                          </Space>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">
                            A. {question.optionA || "-"}
                          </Text>
                          <br />
                          <Text type="secondary">
                            B. {question.optionB || "-"}
                          </Text>
                          <br />
                          <Text type="secondary">
                            C. {question.optionC || "-"}
                          </Text>
                          <br />
                          <Text type="secondary">
                            D. {question.optionD || "-"}
                          </Text>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">
                            Correct option: {question.correctOption || "-"}
                          </Text>
                        </div>
                        <Text type="secondary">
                          Explanation: {question.explanation || "-"}
                        </Text>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      ) : null}
    </Card>
  );
}

export default function ExistingTestsModal({
  open,
  onCancel,
  videoId,
  videoName,
  onViewAttempts,
}: Props) {
  const [deleteTest, { isLoading: isDeletingTest }] = useDeleteTestMutation();
  const { data, isFetching, refetch } = useGetTestsQuery(
    videoId ? { page: 1, limit: 50, videoId } : skipToken,
  );
  const tests = useMemo(() => data?.tests ?? [], [data]);

  const handleDeleteTest = async (testId: string) => {
    try {
      await deleteTest(testId).unwrap();
      message.success("Test deleted successfully.");
      await refetch();
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to delete test.");
    }
  };

  return (
    <Modal
      title={videoName ? `Tests for ${videoName}` : "Existing Tests"}
      open={open}
      maskClosable={false}
      onCancel={onCancel}
      width={760}
      footer={null}
      destroyOnHidden
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {isFetching ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 100,
            }}
          >
            <Spin />
          </div>
        ) : tests.length === 0 ? (
          <Empty description="No tests created for this video yet." />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }}>
            {tests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onDeleteTest={handleDeleteTest}
                onViewAttempts={onViewAttempts}
                onRefresh={async () => {
                  await refetch();
                }}
              />
            ))}
          </Space>
        )}
      </Space>
    </Modal>
  );
}
