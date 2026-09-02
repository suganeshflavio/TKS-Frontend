"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { Button, Divider, Popover, Space, message } from "antd";
import {
  BoldOutlined,
  FunctionOutlined,
  ItalicOutlined,
  LoadingOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { MathInline } from "./mathExtension";
import FormulaEditorModal from "./FormulaEditorModal";
import { useUploadInlineImageMutation } from "@/store/features/uploadsApi";

const SYMBOLS = [
  "±", "×", "÷", "√", "∞", "π", "θ", "Δ", "Σ", "∫",
  "≤", "≥", "≠", "≈", "°", "→", "←", "↔", "∈", "∉",
  "⊂", "∪", "∩", "½", "¼", "¾", "α", "β", "γ", "λ",
  "μ", "Ω", "∴", "∝", "⊥", "∥",
];

interface Props {
  readonly value?: string;
  readonly onChange?: (html: string) => void;
  readonly placeholder?: string;
  readonly minHeight?: number;
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 90 }: Props) {
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [editingLatex, setEditingLatex] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadInlineImage, { isLoading: isUploadingImage }] = useUploadInlineImageMutation();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      ImageExtension.configure({ inline: true, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Type here…" }),
      Superscript,
      Subscript,
      MathInline,
    ],
    content: value ?? "",
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rte-content",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const incoming = value ?? "";

    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file || !editor) {
        return;
      }

      try {
        const result = await uploadInlineImage(file).unwrap();
        editor.chain().focus().setImage({ src: result.url }).run();
      } catch (error: unknown) {
        message.error((error as Error)?.message || "Unable to upload image.");
      }
    },
    [editor, uploadInlineImage],
  );

  const openFormulaModal = () => {
    if (editor?.isActive("mathInline")) {
      const attrs = editor.getAttributes("mathInline");
      setEditingLatex(typeof attrs.latex === "string" ? attrs.latex : "");
    } else {
      setEditingLatex(undefined);
    }
    setFormulaOpen(true);
  };

  const handleFormulaSubmit = (latex: string) => {
    if (!editor) return;

    if (editor.isActive("mathInline")) {
      editor.chain().focus().updateAttributes("mathInline", { latex }).run();
    } else {
      editor.chain().focus().insertMath(latex).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div style={{ border: "1px solid #d9d9d9", borderRadius: 6 }}>
      <div
        style={{
          borderBottom: "1px solid #f0f0f0",
          padding: "4px 6px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Space size={2} wrap>
          <Button
            size="small"
            type={editor.isActive("bold") ? "primary" : "text"}
            icon={<BoldOutlined />}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <Button
            size="small"
            type={editor.isActive("italic") ? "primary" : "text"}
            icon={<ItalicOutlined />}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <Button
            size="small"
            type={editor.isActive("superscript") ? "primary" : "text"}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
          >
            x²
          </Button>
          <Button
            size="small"
            type={editor.isActive("subscript") ? "primary" : "text"}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
          >
            x₂
          </Button>

          <Divider type="vertical" style={{ margin: "0 4px" }} />

          <Button
            size="small"
            type="text"
            icon={isUploadingImage ? <LoadingOutlined /> : <PictureOutlined />}
            disabled={isUploadingImage}
            onClick={handleImageButtonClick}
            title="Insert image or diagram"
          />
          <Button
            size="small"
            type={editor.isActive("mathInline") ? "primary" : "text"}
            icon={<FunctionOutlined />}
            onClick={openFormulaModal}
            title="Insert formula"
          />
          <Popover
            trigger="click"
            content={
              <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 28px)", gap: 2, maxWidth: 280 }}>
                {SYMBOLS.map((symbol) => (
                  <Button
                    key={symbol}
                    size="small"
                    type="text"
                    onClick={() => editor.chain().focus().insertContent(symbol).run()}
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
            }
          >
            <Button size="small" type="text" title="Insert symbol">
              Ω
            </Button>
          </Popover>
        </Space>
      </div>

      <div style={{ padding: "8px 10px", minHeight }}>
        <EditorContent editor={editor} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        style={{ display: "none" }}
        onChange={(event) => void handleFileSelected(event)}
      />

      <FormulaEditorModal
        open={formulaOpen}
        initialLatex={editingLatex}
        onCancel={() => setFormulaOpen(false)}
        onSubmit={handleFormulaSubmit}
      />
    </div>
  );
}
