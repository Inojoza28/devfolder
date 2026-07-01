import { useMemo } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import java from "highlight.js/lib/languages/java";
import csharp from "highlight.js/lib/languages/csharp";
import cpp from "highlight.js/lib/languages/cpp";
import c from "highlight.js/lib/languages/c";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import scss from "highlight.js/lib/languages/scss";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";

import type { Language } from "@/lib/types";
import { cn } from "@/lib/utils";

let registered = false;
function registerLanguages() {
  if (registered) return;
  hljs.registerLanguage("typescript", typescript);
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("python", python);
  hljs.registerLanguage("go", go);
  hljs.registerLanguage("rust", rust);
  hljs.registerLanguage("java", java);
  hljs.registerLanguage("csharp", csharp);
  hljs.registerLanguage("cpp", cpp);
  hljs.registerLanguage("c", c);
  hljs.registerLanguage("php", php);
  hljs.registerLanguage("ruby", ruby);
  hljs.registerLanguage("swift", swift);
  hljs.registerLanguage("kotlin", kotlin);
  hljs.registerLanguage("html", xml);
  hljs.registerLanguage("css", css);
  hljs.registerLanguage("scss", scss);
  hljs.registerLanguage("sql", sql);
  hljs.registerLanguage("bash", bash);
  hljs.registerLanguage("json", json);
  hljs.registerLanguage("yaml", yaml);
  hljs.registerLanguage("markdown", markdown);
  hljs.registerLanguage("plaintext", plaintext);
  registered = true;
}

interface Props {
  code: string;
  language: Language;
  className?: string;
  withLineNumbers?: boolean;
  maxLines?: number;
}

export function CodeBlock({
  code,
  language,
  className,
  withLineNumbers = false,
  maxLines,
}: Props) {
  registerLanguages();

  const shown = useMemo(() => {
    if (!maxLines) return code;
    const lines = code.split("\n");
    return lines.slice(0, maxLines).join("\n");
  }, [code, maxLines]);

  const html = useMemo(() => {
    try {
      return hljs.highlight(shown, { language, ignoreIllegals: true }).value;
    } catch {
      return escapeHtml(shown);
    }
  }, [shown, language]);

  if (withLineNumbers) {
    const lineCount = shown.split("\n").length;
    const nums = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
    return (
      <pre
        className={cn(
          "font-mono text-[13px] leading-6 overflow-auto scrollbar-slim",
          className,
        )}
      >
        <div className="flex">
          <code
            aria-hidden
            className="pr-4 text-right text-muted-foreground/40 select-none whitespace-pre"
          >
            {nums}
          </code>
          <code
            className="hljs flex-1 whitespace-pre"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </pre>
    );
  }

  return (
    <pre
      className={cn(
        "font-mono text-xs leading-relaxed overflow-hidden",
        className,
      )}
    >
      <code
        className="hljs whitespace-pre"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
