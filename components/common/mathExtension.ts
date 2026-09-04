import { Node } from "@tiptap/core";
import katex from "katex";

export interface MathInlineOptions {
  HTMLAttributes: Record<string, string>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      insertMath: (latex: string) => ReturnType;
    };
  }
}

function renderKatexSpan(latex: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.setAttribute("data-type", "math-inline");
  span.setAttribute("data-latex", latex);
  span.className = "rte-math";

  try {
    span.innerHTML = katex.renderToString(latex || "", {
      throwOnError: false,
      strict: false,
      output: "html",
    });
  } catch {
    span.textContent = latex;
  }

  return span;
}

export const MathInline = Node.create<MathInlineOptions>({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") ?? "",
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="math-inline"]' }];
  },

  renderHTML({ node }) {
    return renderKatexSpan(String(node.attrs.latex ?? ""));
  },

  addCommands() {
    return {
      insertMath:
        (latex: string) =>
        ({ chain }) => {
          return chain().insertContent({ type: this.name, attrs: { latex } }).run();
        },
    };
  },
});

export default MathInline;
