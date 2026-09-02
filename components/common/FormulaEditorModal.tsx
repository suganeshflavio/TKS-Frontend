"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Modal, Typography } from "antd";
import katex from "katex";

const { Text } = Typography;

const EditableMathField = dynamic(
  () => import("react-mathquill").then((mod) => {
    mod.addStyles();
    return mod.EditableMathField;
  }),
  { ssr: false },
);

interface Props {
  readonly open: boolean;
  readonly initialLatex?: string;
  readonly onCancel: () => void;
  readonly onSubmit: (latex: string) => void;
}

export default function FormulaEditorModal({ open, initialLatex, onCancel, onSubmit }: Props) {
  const [latex, setLatex] = useState(initialLatex ?? "");
  const [openedWithLatex, setOpenedWithLatex] = useState<string | undefined>(undefined);

  if (open && openedWithLatex === undefined) {
    setOpenedWithLatex(initialLatex ?? "");
    setLatex(initialLatex ?? "");
  } else if (!open && openedWithLatex !== undefined) {
    setOpenedWithLatex(undefined);
  }

  const previewHtml = useMemo(() => {
    if (!latex.trim()) {
      return "";
    }

    try {
      return katex.renderToString(latex, { throwOnError: false, strict: false, output: "html" });
    } catch {
      return "";
    }
  }, [latex]);

  return (
    <Modal
      title="Insert Formula"
      open={open}
      onCancel={onCancel}
      onOk={() => {
        if (latex.trim()) {
          onSubmit(latex.trim());
        }
        onCancel();
      }}
      okText={initialLatex ? "Update" : "Insert"}
      okButtonProps={{ disabled: !latex.trim() }}
      destroyOnHidden
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Click to build the equation — use the on-screen keys or your keyboard (type <code>/</code> for a
            fraction, <code>^</code> for an exponent, <code>sqrt</code> for a root).
          </Text>
        </div>

        <div
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            padding: 12,
            minHeight: 48,
          }}
        >
          <EditableMathField
            latex={latex}
            onChange={(mathField: { latex: () => string }) => setLatex(mathField.latex())}
            style={{ width: "100%", fontSize: 18, border: "none" }}
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Preview
          </Text>
          <div
            style={{
              border: "1px dashed #d9d9d9",
              borderRadius: 6,
              padding: 12,
              minHeight: 40,
              display: "flex",
              alignItems: "center",
            }}
          >
            {previewHtml ? (
              <span dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <Text type="secondary">Nothing to preview yet.</Text>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
