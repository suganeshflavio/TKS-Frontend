"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Steps,
  Typography,
  message,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useCreateTestMutation } from "@/store/features/testsApi";
import RichTextEditor from "../common/RichTextEditor";

const { Text } = Typography;

type McqQuestionDraft = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
};

type McqFormValues = {
  testName: string;
  marksPerQuestion: number;
  questions: McqQuestionDraft[];
};

interface Props {
  readonly open: boolean;
  readonly onCancel: () => void;
  readonly onSave?: (values: McqFormValues) => void;
}

const createDefaultQuestion = (): McqQuestionDraft => ({
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
  explanation: "",
});

export default function McqModal({
  open,
  onCancel,
  onSave,
}: Props) {
  const [form] = Form.useForm<McqFormValues>();
  const [createTest, { isLoading: isCreating }] = useCreateTestMutation();
  const [step, setStep] = useState(0);
  const [wasOpen, setWasOpen] = useState(false);

  const questions = Form.useWatch("questions", form) ?? [];

  if (open && !wasOpen) {
    setWasOpen(true);
    setStep(0);
    form.resetFields();
    form.setFieldsValue({
      testName: "",
      marksPerQuestion: 2,
      questions: [createDefaultQuestion()],
    });
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const handleFinish = async () => {
    const values = form.getFieldsValue(true) as McqFormValues;
    const testName = String(values.testName ?? "").trim();
    const marksPerQuestion = values.marksPerQuestion ?? 2;

    if (!testName) {
      message.error("Enter a test name before creating the test.");
      return;
    }

    const normalizedQuestions = (values.questions ?? [])
      .filter(Boolean)
      .map((question) => ({
        ...question,
        question: String(question?.question ?? "").trim(),
        optionA: String(question?.optionA ?? "").trim(),
        optionB: String(question?.optionB ?? "").trim(),
        optionC: String(question?.optionC ?? "").trim(),
        optionD: String(question?.optionD ?? "").trim(),
        correctOption: String(question?.correctOption ?? "").trim(),
        explanation: String(question?.explanation ?? "").trim(),
      }))
      .filter((question) => question.question);

    if (normalizedQuestions.length === 0) {
      message.error("Add at least one question to create the test.");
      return;
    }

    try {
      await createTest({
        testName,
        marksPerQuestion,
        questions: normalizedQuestions,
      }).unwrap();

      message.success("Test created successfully.");
      onSave?.(values);
      form.resetFields();
      onCancel();
    } catch (error: unknown) {
      message.error((error as Error)?.message || "Unable to create test.");
    }
  };

  const handleNext = async () => {
    try {
      if (step === 0) {
        await form.validateFields(["testName", "marksPerQuestion"]);
        setStep(1);
        return;
      }

      await form.validateFields();
      await handleFinish();
    } catch {
      // validation handled by antd
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <Modal
      title="Create MCQ Test"
      open={open}
      maskClosable={false}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      width={980}
      footer={null}
      destroyOnHidden
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Steps
          current={step}
          size="small"
          items={[{ title: "Test details" }, { title: "Questions" }]}
        />

        <Form form={form} layout="vertical" preserve={true}>
          {step === 0 ? (
            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              <Form.Item
                label="Test Name"
                name="testName"
                preserve={true}
                rules={[{ required: true, message: "Enter a test name" }]}
              >
                <Input placeholder="Flutter Basics Test" />
              </Form.Item>

              <Form.Item
                label="Marks per question"
                name="marksPerQuestion"
                preserve={true}
                rules={[{ required: true, message: "Enter marks" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </div>
          ) : (
            <Form.List name="questions">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      size="small"
                      style={{ marginBottom: 12 }}
                    >
                      <Space
                        align="center"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Text strong>Question {index + 1}</Text>
                        {fields.length > 1 ? (
                          <Button
                            size="small"
                            danger
                            type="text"
                            onClick={() => remove(field.name)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </Space>

                      <Form.Item
                        label="Question"
                        name={[field.name, "question"]}
                        rules={[{ required: true, message: "Enter question" }]}
                      >
                        <RichTextEditor placeholder="What is the main language used in Flutter?" />
                      </Form.Item>

                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                        }}
                      >
                        <Form.Item
                          name={[field.name, "optionA"]}
                          label="Option A"
                          rules={[
                            { required: true, message: "Enter option A" },
                          ]}
                        >
                          <RichTextEditor placeholder="Java" minHeight={44} />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "optionB"]}
                          label="Option B"
                          rules={[
                            { required: true, message: "Enter option B" },
                          ]}
                        >
                          <RichTextEditor placeholder="Dart" minHeight={44} />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "optionC"]}
                          label="Option C"
                          rules={[
                            { required: true, message: "Enter option C" },
                          ]}
                        >
                          <RichTextEditor placeholder="Python" minHeight={44} />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "optionD"]}
                          label="Option D"
                          rules={[
                            { required: true, message: "Enter option D" },
                          ]}
                        >
                          <RichTextEditor placeholder="Kotlin" minHeight={44} />
                        </Form.Item>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                        }}
                      >
                        <Form.Item
                          name={[field.name, "correctOption"]}
                          label="Correct option"
                          rules={[
                            {
                              required: true,
                              message: "Select correct answer",
                            },
                          ]}
                        >
                          <Select
                            options={[
                              { label: "A", value: "A" },
                              { label: "B", value: "B" },
                              { label: "C", value: "C" },
                              { label: "D", value: "D" },
                            ]}
                          />
                        </Form.Item>

                        <Form.Item
                          name={[field.name, "explanation"]}
                          label="Explanation"
                        >
                          <RichTextEditor placeholder="Explain why this is correct" />
                        </Form.Item>
                      </div>
                    </Card>
                  ))}

                  <Button
                    onClick={() => add(createDefaultQuestion())}
                    disabled={questions.length >= 25}
                  >
                    Add another question ({questions.length}/25)
                  </Button>
                </div>
              )}
            </Form.List>
          )}

          <Divider />

          <Space>
            <Button
              onClick={() => {
                form.resetFields();
                onCancel();
              }}
            >
              Cancel
            </Button>
            {step > 0 ? (
              <Button icon={<LeftOutlined />} onClick={handleBack}>
                Back
              </Button>
            ) : null}
            {step === 0 ? (
              <Button type="primary" onClick={handleNext}>
                Next <RightOutlined />
              </Button>
            ) : (
              <Button
                type="primary"
                loading={isCreating}
                onClick={() => void handleFinish()}
              >
                Create Test
              </Button>
            )}
          </Space>
        </Form>
      </Space>
    </Modal>
  );
}
