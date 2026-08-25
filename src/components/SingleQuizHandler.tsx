import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { MoveLeft, Clock, ListChecks, Pencil, ImagePlus } from "lucide-react";
import CodeBlock, { parseCodeBlock } from "./CodeBlock";
import CustomSelect from "./CustomSelect";

/* ===================== Types ===================== */

interface Option {
  text?: string | null;
  image?: string | null;
}

interface Question {
  sno: string;
  question: string;
  questionImage?: string;
  options: Option[];
  multiple: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  totalQuestions: number;
  totalPages: number;
}

interface QuizDetails {
  _id: string;
  name: string;
  duration: number;
  totalQuestions: number;
  quizQuestions: number;
  questions: Question[];
  pagination: Pagination;
  createdAt: string;
}

const LIMIT = 15;

/* ===================== Main Component ===================== */

const SingleQuizHandler: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quizMeta, setQuizMeta] = useState<Omit<
    QuizDetails,
    "questions" | "pagination"
  > | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  /* ---- Edit Popup State ---- */
  const [editOpen, setEditOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---- Filter State ---- */
  const [filterNeedsImage, setFilterNeedsImage] = useState(false);
  const [filterHasCode, setFilterHasCode] = useState(false);

  /* ---- Image Preview State ---- */
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  /* ---- Table State ---- */
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const loaderRef = useRef<HTMLDivElement | null>(null);

  /* ===================== Fetch Questions ===================== */

  const fetchQuestions = async (targetPage = page, isReset = false) => {
    if ((loading || !hasMore) && !isReset) return;
    setLoading(true);

    try {
      const res = await fetch("/api/quizdetails", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: id, page: targetPage, limit: LIMIT, filterNeedsImage, filterHasCode }),
      });

      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();

      if (!quizMeta || isReset) {
        const { questions, pagination, ...meta } = data;
        setQuizMeta(meta);
      }

      setQuestions((prev) => isReset ? data.questions : [...prev, ...data.questions]);
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setPage(targetPage + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(1, true);
  }, [filterNeedsImage, filterHasCode]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchQuestions();
        }
      },
      { threshold: 0.1 },
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  /* ===================== Update Question ===================== */

  const handleUpdateQuestion = async (updated: Question) => {
    if (!id) return;

    try {
      setSaving(true);

      const res = await fetch("/api/update-question", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: id,
          ...updated,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      const data = await res.json();

      setQuestions((prev) =>
        prev.map((q) => (q.sno === data.question.sno ? data.question : q)),
      );

      setEditOpen(false);
      setEditingQuestion(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update question");
    } finally {
      setSaving(false);
    }
  };

  /* ===================== Guards ===================== */

  if (!quizMeta && loading)
    return <div className="p-6 text-center text-sm">Loading quiz…</div>;

  if (!quizMeta)
    return <div className="p-6 text-center text-sm">No quiz found</div>;

  /* ===================== JSX ===================== */

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      {/* ---------- Header ---------- */}
      <header className="h-14 flex items-center justify-between border-b border-neutral-200 bg-white px-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 border border-neutral-300 rounded-md hover:bg-neutral-100"
          >
            <MoveLeft size={16} />
          </button>
          <h2 className="text-lg font-bold text-black truncate max-w-md">
            {quizMeta.name}
          </h2>
        </div>

        <div className="flex gap-4 text-xs font-medium text-neutral-700 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="font-semibold text-neutral-600">Needs Image</span>
            <input
              type="checkbox"
              checked={filterNeedsImage}
              onChange={(e) => setFilterNeedsImage(e.target.checked)}
              className="w-4 h-4 text-black border-neutral-300 rounded focus:ring-black cursor-pointer"
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer mr-2">
            <span className="font-semibold text-neutral-600">Has Code</span>
            <input
              type="checkbox"
              checked={filterHasCode}
              onChange={(e) => setFilterHasCode(e.target.checked)}
              className="w-4 h-4 text-black border-neutral-300 rounded focus:ring-black cursor-pointer"
            />
          </label>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{quizMeta.duration} min</span>
          </div>
          <div className="flex items-center gap-1">
            <ListChecks size={14} />
            <span>{quizMeta.totalQuestions}</span>
          </div>
        </div>
      </header>

      {/* ---------- Content ---------- */}
      <main className="flex-1 overflow-hidden p-3">
        <div className="h-full overflow-y-auto w-full border border-neutral-300 rounded-xl bg-white shadow-sm relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-neutral-100/90 backdrop-blur-md z-10 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4 font-semibold text-neutral-600 w-12 text-center">#</th>
                <th className="py-3 px-4 font-semibold text-neutral-600 min-w-[300px]">Question</th>
                <th className="py-3 px-4 font-semibold text-neutral-600 min-w-[200px]">Options</th>
                <th className="py-3 px-4 font-semibold text-neutral-600 w-32">Type</th>
                <th className="py-3 px-4 font-semibold text-neutral-600 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {questions.map((q, index) => {
                return (
                  <tr
                    key={q.sno}
                    className="hover:bg-neutral-50/50 transition-colors group align-top"
                  >
                    <td className="py-4 px-4 text-center font-bold text-neutral-400">
                      {index + 1}
                    </td>

                    {/* Question Column */}
                    <td className="py-4 px-4 max-w-md">
                      <div>
                        <CodeBlock
                          raw={q.question}
                          image={q.questionImage || null}
                          onImageClick={setPreviewImage}
                        />
                      </div>
                    </td>

                    {/* Options Column */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt, idx) => {
                          const isCorrect = q.correct_options?.includes(idx);
                          return (
                            <div key={idx} className="flex gap-2 text-sm text-neutral-700 items-start">
                              <span className={`font-bold min-w-[16px] ${isCorrect ? 'text-green-600' : 'text-neutral-400'}`}>{String.fromCharCode(65 + idx)}.</span>
                              <div className="flex-1">
                                {opt.text && <span>{opt.text}</span>}
                                {opt.image && (
                                  <img
                                    src={opt.image}
                                    className="mt-1 max-h-16 rounded object-contain border border-neutral-200 cursor-pointer"
                                    onClick={() => setPreviewImage(opt.image!)}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* Type Column */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-md text-[10px] font-bold uppercase whitespace-nowrap">
                        {q.multiple ? "Multiple" : "Single"}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingQuestion(q);
                            setEditOpen(true);
                          }}
                          className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-blue-600 w-full justify-center p-1.5 rounded hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div ref={loaderRef} className="py-6 text-center text-xs w-full bg-white border-t border-neutral-100">
            {loading && <div className="animate-pulse font-medium">Loading rows…</div>}
            {!hasMore && (
              <div className="text-neutral-400">End of questions</div>
            )}
          </div>
        </div>
      </main>

      {/* ---------- Image Preview Modal ---------- */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out transition-all"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            className="max-w-[800px] max-h-[600px] object-contain shadow-2xl rounded-md cursor-auto bg-white/5"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 text-white hover:text-neutral-300 transition bg-black/50 p-2 rounded-full"
            onClick={() => setPreviewImage(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}

      {/* ---------- Edit Modal ---------- */}
      <EditQuestionModal
        open={editOpen}
        quizId={id || ""}
        question={editingQuestion}
        saving={saving}
        onClose={() => {
          setEditOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleUpdateQuestion}
      />
    </div>
  );
};

/* ===================== Modal ===================== */

const EditQuestionModal = ({
  open,
  quizId,
  question,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  quizId: string;
  question: Question | null;
  saving: boolean;
  onClose: () => void;
  onSave: (q: Question) => void;
}) => {
  const [form, setForm] = useState<Question | null>(question);
  const [uploading, setUploading] = useState(false);

  // New Codeblock UI state
  const [plainQuestion, setPlainQuestion] = useState("");
  const [hasCode, setHasCode] = useState(false);
  const [codeLang, setCodeLang] = useState("plaintext");
  const [codeContent, setCodeContent] = useState("");
  const [isCodeEditing, setIsCodeEditing] = useState(false);

  useEffect(() => {
    if (question) {
      setForm(question);
      const parsed = parseCodeBlock(question.question || "");
      setPlainQuestion(parsed.question);
      if (parsed.isRich) {
        setHasCode(true);
        setCodeLang(parsed.lang);
        setCodeContent(parsed.code);
      } else {
        setHasCode(false);
        setCodeLang("plaintext");
        setCodeContent("");
      }
    } else {
      setForm(null);
    }
  }, [question]);

  if (!open || !form) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean, optIdx?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      formData.append("quizId", quizId);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Upload failed");

      const imageUrl = data.imageUrl;

      if (isMain) {
        setForm({ ...form, questionImage: imageUrl });
      } else if (optIdx !== undefined) {
        const next = [...form.options];
        next[optIdx] = { ...next[optIdx], image: imageUrl };
        setForm({ ...form, options: next });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (isMain: boolean, optIdx?: number) => {
    if (isMain) {
      setForm({ ...form, questionImage: null });
    } else if (optIdx !== undefined) {
      const next = [...form.options];
      next[optIdx] = { ...next[optIdx], image: null };
      setForm({ ...form, options: next });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 transition-opacity">
      <div className="bg-white w-[500px] h-full shadow-2xl flex flex-col transform transition-transform translate-x-0 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-black">Edit Question</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black transition text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">
              Question Text
            </label>
            <textarea
              className="w-full border border-neutral-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[120px] text-black text-base transition-all resize-y"
              rows={4}
              value={plainQuestion}
              onChange={(e) => setPlainQuestion(e.target.value)}
            />

            <div className="mt-4 border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
              <div className={`flex items-center justify-between ${hasCode ? 'mb-4' : ''}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCode}
                    onChange={(e) => setHasCode(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer"
                  />
                  <span className="text-sm font-bold text-neutral-700">Add Codeblock</span>
                </label>

                {hasCode && (
                  <div className="w-40">
                    <CustomSelect
                      value={codeLang}
                      onChange={setCodeLang}
                      options={[
                        { value: "plaintext", label: "Plaintext" },
                        { value: "python", label: "Python" },
                        { value: "javascript", label: "JavaScript" },
                        { value: "typescript", label: "TypeScript" },
                        { value: "tsx", label: "TSX" },
                        { value: "java", label: "Java" },
                        { value: "c", label: "C / C++" }
                      ]}
                      stylePropsOfSelect="p-1.5 text-sm font-medium"
                      className="rounded-md"
                    />
                  </div>
                )}
              </div>

              {hasCode && (
                <div className="flex flex-col gap-3">
                  {isCodeEditing ? (
                    <textarea
                      autoFocus
                      className="w-full font-mono text-sm border border-neutral-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-black focus:border-transparent transition bg-white"
                      rows={6}
                      value={codeContent}
                      onChange={(e) => setCodeContent(e.target.value)}
                      onBlur={() => setIsCodeEditing(false)}
                      placeholder="Paste your code here..."
                    />
                  ) : (
                    <div
                      className="w-full cursor-text transition border-2 border-transparent rounded-lg"
                      onClick={() => setIsCodeEditing(true)}
                    >
                      <div className="min-h-[140px]">
                        {codeContent ? (
                          <CodeBlock raw={`\`\`\`${codeLang}\n${codeContent}\n\`\`\``} image={null} />
                        ) : (
                          <div className="w-full h-[140px] border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center text-neutral-500 font-medium text-sm hover:border-black hover:bg-neutral-50 transition cursor-pointer bg-white">
                            Click to paste code...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Question Image</label>
            {form.questionImage ? (
              <div className="relative inline-block border p-2 rounded-md bg-gray-50">
                <img src={form.questionImage} alt="Question" className="h-32 object-contain" />
                <button
                  className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  onClick={() => handleRemoveImage(true)}
                >&times;</button>
              </div>
            ) : (
              <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition py-6">
                <div className="p-3 bg-white rounded-full mb-3 shadow-sm border border-neutral-200">
                  <ImagePlus className="w-6 h-6 text-black" />
                </div>
                <p className="text-sm font-medium text-neutral-700 mb-1">
                  Drag and drop or <span className="text-black font-bold">browse</span>
                </p>
                <p className="text-xs text-neutral-500">PNG or JPG</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, true)}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm bg-gray-100 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-200 transition">
            <input
              type="checkbox"
              className="w-4 h-4 rounded text-black focus:ring-black accent-black"
              checked={form.multiple}
              onChange={(e) => {
                const isMultiple = e.target.checked;
                let nextCorrect = form.correct_options || [];
                if (!isMultiple && nextCorrect.length > 1) {
                  nextCorrect = [nextCorrect[0]];
                }
                setForm({ ...form, multiple: isMultiple, correct_options: nextCorrect });
              }}
            />
            <span className="font-semibold text-gray-800">Multiple correct answers</span>
          </label>

          <div className="border-t pt-4">
            <h4 className="text-sm font-bold mb-4 text-gray-700">Options</h4>
            {form.options.map((opt, idx) => {
              const isCorrect = form.correct_options?.includes(idx);
              return (
                <div key={idx} className={`p-4 border rounded-xl mb-4 space-y-3 shadow-sm transition-all ${isCorrect ? 'border-green-400 bg-green-500/10' : 'border-neutral-200 bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type={form.multiple ? "checkbox" : "radio"}
                      name="correct_option"
                      checked={isCorrect || false}
                      onChange={(e) => {
                        let nextCorrect = [...(form.correct_options || [])];
                        if (form.multiple) {
                          if (e.target.checked) nextCorrect.push(idx);
                          else nextCorrect = nextCorrect.filter((v) => v !== idx);
                        } else {
                          nextCorrect = [idx];
                        }
                        setForm({ ...form, correct_options: nextCorrect });
                      }}
                      className={`mt-2 w-4 h-4 cursor-pointer ${form.multiple ? 'rounded' : ''} text-black focus:ring-black accent-black border-neutral-300`}
                    />
                    <span className={`font-black w-6 text-center mt-1.5 ${isCorrect ? 'text-green-600' : 'text-neutral-400'}`}>{String.fromCharCode(65 + idx)}</span>
                    <textarea
                      className={`flex-1 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[80px] text-sm transition-all resize-y ${isCorrect ? 'border-black shadow-sm bg-white' : 'border-neutral-300 bg-white'}`}
                      value={opt.text || ""}
                      placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                      rows={2}
                      onChange={(e) => {
                        const next = [...form.options];
                        next[idx] = { ...next[idx], text: e.target.value };
                        setForm({ ...form, options: next });
                      }}
                    />
                  </div>
                  <div className="pl-14">
                    {opt.image ? (
                      <div className="relative inline-block border p-1 rounded-md bg-white">
                        <img src={opt.image} alt="Option" className="h-20 object-contain" />
                        <button
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          onClick={() => handleRemoveImage(false, idx)}
                        >&times;</button>
                      </div>
                    ) : (
                      <label className="w-full flex flex-row items-center justify-between border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition py-2 px-3 mt-2">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-white rounded-full shadow-sm border border-neutral-200">
                            <ImagePlus className="w-4 h-4 text-black" />
                          </div>
                          <p className="text-xs font-medium text-neutral-700">
                            Drag & drop or <span className="text-black font-bold">browse</span> image
                          </p>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-medium">PNG or JPG</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, false, idx)}
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>


        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-black font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const finalQuestionText = hasCode && codeContent.trim()
                ? `${plainQuestion.trim()}\n\n\`\`\`${codeLang}\n${codeContent}\n\`\`\``
                : plainQuestion.trim();
              onSave({ ...form, question: finalQuestionText });
            }}
            disabled={saving || uploading}
            className="px-6 py-2 bg-black text-white rounded-md font-semibold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : uploading ? "Uploading..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleQuizHandler;
