"use client";

import { useState } from "react";
import { Button, Card, Input, InputNumber, Modal, Select, Space, Spin, Typography, message } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  type TestQuestion,
  useAddQuestionMutation,
  useDeleteQuestionMutation,
  useGetTestByIdQuery,
  useUpdateQuestionMutation,
  useUpdateTestMutation,
} from "@/store/features/testsApi";

const { Text } = Typography;

interface Props {
  readonly open: boolean;
  readonly testId?: string;
  readonly onClose: () => void;
}

export default function ManageTestModal({ open, testId, onClose }: Props) {
  const {
    data: test,
    refetch: refetchTest,
    isFetching: isFetchingTest,
  } = useGetTestByIdQuery(open && testId ? testId : skipToken);

  const [updateTest, { isLoading: isUpdatingTest }] = useUpdateTestMutation();
  const [addQuestion, { isLoading: isAddingQuestion }] = useAddQuestionMutation();
  const [updateQuestion, { isLoading: isUpdatingQuestion }] = useUpdateQuestionMutation();
  const [deleteQuestion, { isLoading: isDeletingQuestion }] = useDeleteQuestionMutation();

  const [editingTest, setEditingTest] = useState(false);
  const [draftTestName, setDraftTestName] = useState("");
  const [draftMarks, setDraftMarks] = useState(1);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [draftQuestion, setDraftQuestion] = useState<Partial<TestQuestion> | null>(null);
  const [loadedTestId, setLoadedTestId] = useState<string | undefined>(undefined);

  if (test && test.id !== loadedTestId) {
    setLoadedTestId(test.id);
    setDraftTestName(test.testName ?? "");
    setDraftMarks(test.marksPerQuestion ?? 1);
    setEditingTest(false);
    setEditingQuestionId(null);
    setDraftQuestion(null);
  }

  if (!testId) {
    return null;
  }

  const handleSaveTest = async () => {
    const trimmedName = draftTestName.trim();
    if (!trimmedName) {
      message.error("Enter a test name before saving.");
      return;
    }

    try {
      await updateTest({ id: testId, body: { testName: trimmedName, marksPerQuestion: draftMarks } }).unwrap();
      message.success("Test updated successfully.");
      setEditingTest(false);
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to update test.");
    }
  };

  const handleAddQuestion = async () => {
    try {
      await addQuestion({
        id: testId,
        body: {
          question: "New question",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctOption: "A",
          explanation: "",
        },
      }).unwrap();

      await refetchTest();
      message.success("New question added.");
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to add question.");
    }
  };

  const handleDeleteQuestion = async (question: TestQuestion) => {
    if (!question.id) return;

    try {
      await deleteQuestion({ id: testId, questionId: question.id }).unwrap();
      await refetchTest();
      message.success("Question deleted successfully.");
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to delete question.");
    }
  };

  const handleSaveQuestion = async () => {
    if (!draftQuestion?.question?.trim() || !editingQuestionId) {
      message.error("Enter the question text before saving.");
      return;
    }

    try {
      await updateQuestion({
        id: testId,
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
      setEditingQuestionId(null);
      setDraftQuestion(null);
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to update question.");
    }
  };

  const questions = test?.questions ?? [];

  return (
    <Modal
      title={test?.testName ? `Manage "${test.testName}"` : "Manage Test"}
      open={open}
      maskClosable={false}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      width={840}
      destroyOnHidden
    >
      {isFetchingTest ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <Card size="small">
            <Space style={{ display: "flex", justifyContent: "space-between", width: "100%" }} align="center" wrap>
              <Text strong>Test details</Text>
              {!editingTest ? (
                <Button size="small" icon={<EditOutlined />} onClick={() => setEditingTest(true)}>
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
                  <Button type="primary" loading={isUpdatingTest} onClick={() => void handleSaveTest()}>
                    Save Test
                  </Button>
                </Space>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <Text>{test?.testName ?? "Untitled Test"}</Text>
                <div>
                  <Text type="secondary">Marks per question: {test?.marksPerQuestion ?? 1}</Text>
                </div>
              </div>
            )}
          </Card>

          <Card size="small">
            <Space style={{ display: "flex", justifyContent: "space-between", width: "100%" }} align="center" wrap>
              <Text strong>Questions</Text>
              <Button type="dashed" onClick={() => void handleAddQuestion()} loading={isAddingQuestion}>
                Add Question
              </Button>
            </Space>
            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {questions.length === 0 ? (
                <Text type="secondary">No questions yet.</Text>
              ) : (
                questions.map((question) => (
                  <div
                    key={question.id ?? `${testId}-${question.question}`}
                    style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}
                  >
                    {editingQuestionId === question.id ? (
                      <div style={{ display: "grid", gap: 12 }}>
                        <Input.TextArea
                          rows={2}
                          value={draftQuestion?.question ?? ""}
                          onChange={(event) =>
                            setDraftQuestion((prev) => ({ ...(prev ?? {}), question: event.target.value }))
                          }
                          placeholder="Question"
                        />
                        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                          <Input
                            value={draftQuestion?.optionA ?? ""}
                            onChange={(event) =>
                              setDraftQuestion((prev) => ({ ...(prev ?? {}), optionA: event.target.value }))
                            }
                            placeholder="Option A"
                          />
                          <Input
                            value={draftQuestion?.optionB ?? ""}
                            onChange={(event) =>
                              setDraftQuestion((prev) => ({ ...(prev ?? {}), optionB: event.target.value }))
                            }
                            placeholder="Option B"
                          />
                          <Input
                            value={draftQuestion?.optionC ?? ""}
                            onChange={(event) =>
                              setDraftQuestion((prev) => ({ ...(prev ?? {}), optionC: event.target.value }))
                            }
                            placeholder="Option C"
                          />
                          <Input
                            value={draftQuestion?.optionD ?? ""}
                            onChange={(event) =>
                              setDraftQuestion((prev) => ({ ...(prev ?? {}), optionD: event.target.value }))
                            }
                            placeholder="Option D"
                          />
                        </div>
                        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                          <Select
                            value={draftQuestion?.correctOption ?? "A"}
                            options={[
                              { label: "A", value: "A" },
                              { label: "B", value: "B" },
                              { label: "C", value: "C" },
                              { label: "D", value: "D" },
                            ]}
                            onChange={(value) => setDraftQuestion((prev) => ({ ...(prev ?? {}), correctOption: value }))}
                          />
                          <Input.TextArea
                            rows={2}
                            value={draftQuestion?.explanation ?? ""}
                            onChange={(event) =>
                              setDraftQuestion((prev) => ({ ...(prev ?? {}), explanation: event.target.value }))
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
                          <Button type="primary" loading={isUpdatingQuestion} onClick={() => void handleSaveQuestion()}>
                            Save Question
                          </Button>
                        </Space>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <Text strong>{question.question ?? "Untitled question"}</Text>
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
                              onClick={() => void handleDeleteQuestion(question)}
                            >
                              Delete
                            </Button>
                          </Space>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">A. {question.optionA || "-"}</Text>
                          <br />
                          <Text type="secondary">B. {question.optionB || "-"}</Text>
                          <br />
                          <Text type="secondary">C. {question.optionC || "-"}</Text>
                          <br />
                          <Text type="secondary">D. {question.optionD || "-"}</Text>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">Correct option: {question.correctOption || "-"}</Text>
                        </div>
                        <Text type="secondary">Explanation: {question.explanation || "-"}</Text>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
}
