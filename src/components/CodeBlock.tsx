import React, { useEffect, useState } from "react";
import { getSingletonHighlighter } from "shiki";
import DOMPurify from "dompurify";

type CodeBlockProps = {
  raw: string;
  image: string | null;
  onImageClick?: (url: string) => void;
};

export function parseCodeBlock(block: string) {
  const match = block.match(/```(\w+)\n([\s\S]*?)```/);

  if (match) {
    const lang = match[1] as
      | "c"
      | "tsx"
      | "typescript"
      | "javascript"
      | "python"
      | "java";
    const code = match[2].trim();
    const question = block.slice(0, match.index).trim();

    return { question, lang, code, isRich: true };
  }

  return {
    question: block.trim(),
    lang: "plaintext" as const,
    code: "",
    isRich: false,
  };
}

const CodeBlock: React.FC<CodeBlockProps> = ({ raw, image, onImageClick }) => {
  const [html, setHtml] = useState<string>("");
  const { lang, code, question } = parseCodeBlock(raw);

  useEffect(() => {
    async function load() {
      const highlighter = await getSingletonHighlighter({
        themes: ["github-light"],
        langs: ["tsx", "typescript", "javascript", "c", "python", "java"],
      });

      const content = code || question;

      const highlighted = highlighter.codeToHtml(content, {
        lang: lang ?? "plaintext",
        theme: "github-light",
      });

      const sanitized = DOMPurify.sanitize(highlighted);
      setHtml(sanitized);
    }
    load();
  }, [raw, code, lang, question]);

  return (
    <div className="w-full h-fit flex-shrink-0 rounded-md overflow-hidden flex flex-col gap-2">
      {question && (
        <div className="w-full py-1 text-lg font-geist">{question}</div>
      )}
      {image && (
        <img 
          src={image} 
          alt="Question" 
          className="w-full max-w-2xl max-h-[500px] object-contain cursor-pointer rounded-md" 
          loading="lazy" 
          onClick={() => onImageClick?.(image)}
        />
      )}
      {code && (
        <div className="w-full flex flex-col rounded-md overflow-hidden border border-gray-300">
          <div className="w-full flex items-center h-8 px-2 bg-neutral-100 border-b border-gray-300">
            <span className="text-base px-2">{lang}</span>
          </div>
          <div
            className="custom-scrollbar w-full h-fit max-h-[600px] overflow-auto rounded-e-md text-lg px-2 font-mono"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </div>
  );
};

export default CodeBlock;
