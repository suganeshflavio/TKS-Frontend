"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";

interface Props {
  readonly html?: string | null;
  readonly fallback?: string;
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

export default function RichContent({ html, fallback = "-", className, style }: Props) {
  const sanitized = useMemo(() => {
    if (!html || !html.trim()) {
      return "";
    }

    return DOMPurify.sanitize(html, { ADD_TAGS: ["math", "semantics", "annotation"] });
  }, [html]);

  if (!sanitized) {
    return <span className={className} style={style}>{fallback}</span>;
  }

  return (
    <span
      className={`rich-content ${className ?? ""}`.trim()}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
