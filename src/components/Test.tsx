import React, { useEffect, useState } from "react";
import { getSingletonHighlighter } from "shiki";
import DOMPurify from "dompurify";

type CodeBlockProps = {
	raw: string;
};

const CodeBlock: React.FC<CodeBlockProps> = ({ raw }) => {
	const [html, setHtml] = useState<string>("");
	const { lang, code, question } = parseCodeBlock(raw);

	useEffect(() => {
		async function load() {
			const highlighter = await getSingletonHighlighter({
				themes: ["github-light"], // light theme only
				langs: ["tsx", "typescript", "javascript", "c", "python", "java"],
			});

			const content = code ?? question;

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
		<div className="w-full rounded-md overflow-hidden flex flex-col">
			{question && <div className="w-full py-1 text-sm">{question}</div>}
			{code && (
				<div className="border">
					<div className="w-full flex items-center h-8 bg-neutral-100 border-b border-neutral-800/20 px-2">
						<span>{lang}</span>
					</div>
					<div
						className="w-full h-[400px] overflow-hidden p-2 font-mono text-sm whitespace-pre-wrap break-words"
						dangerouslySetInnerHTML={{ __html: html }}
					/>
				</div>
			)}
		</div>
	);
};

function parseCodeBlock(block: string) {
	const match = block.match(/```(\w+)[^\n]*\n([\s\S]*?)```/);

	if (match) {
		const lang = match[1] as
			| "c"
			| "tsx"
			| "typescript"
			| "javascript"
			| "python"
			| "java";
		const code = match[2]?.trim();
		const question = block.slice(0, match.index).trim();
		console.log({ code, question, lang });
		return { question, lang, code };
	}

	return { question: block.trim(), lang: "plaintext" as const, code: "" };
}

export default CodeBlock;
