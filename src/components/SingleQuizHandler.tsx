import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { MoveLeft, Clock, ListChecks, Pencil } from "lucide-react";
import CodeBlock, { parseCodeBlock } from "./CodeBlock";

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

const LIMIT = 5;

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

  const loaderRef = useRef<HTMLDivElement | null>(null);

  /* ===================== Fetch Questions ===================== */

  const fetchQuestions = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const res = await fetch("/api/quizdetails", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: id, page, limit: LIMIT }),
      });

      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();

      if (!quizMeta) {
        const { questions, pagination, ...meta } = data;
        setQuizMeta(meta);
      }

      setQuestions((prev) => [...prev, ...data.questions]);
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setPage((p) => p + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

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

        <div className="flex gap-4 text-xs font-medium text-neutral-700">
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
      <main className="flex-1 overflow-hidden p-4 snap-y snap-mandatory">
        <div className="h-full overflow-y-auto w-full">
          {questions.map((q, index) => {
            const parsed = parseCodeBlock(q.question);
            const isRichContent = parsed.isRich || Boolean(q.questionImage);

            return (
              <div
                key={q.sno}
                className={`${isRichContent ? "max-h-fit" : "max-h-[500px]"}
                bg-white border border-neutral-200 rounded-xl p-4 shadow-sm mb-6 snap-start flex gap-6`}
              >
                {/* LEFT */}
                <div className="w-1/2 flex gap-4 border-r border-neutral-100 pr-4 overflow-y-auto">
                  <span className="text-2xl font-black">{index + 1}.</span>
                  <div className="flex-1">
                    <CodeBlock
                      raw={q.question}
                      image={q.questionImage || null}
                    />
                  </div>
                </div>

                {/* RIGHT */}
                <div className="w-1/2 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-black text-white rounded-full text-[10px] font-bold uppercase">
                      {q.multiple ? "Multiple Choice" : "Single Choice"}
                    </span>

                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setEditOpen(true);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-blue-600"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    {q.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 border border-neutral-100 rounded-lg px-3 py-2 mb-2"
                      >
                        <span className="font-bold text-neutral-400">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="flex-1">
                          {opt.text && <p>{opt.text}</p>}
                          {opt.image && (
                            <img
                              src={opt.image}
                              className="mt-2 h-20 object-contain"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={loaderRef} className="h-8 text-center text-xs">
            {loading && <div className="animate-pulse">Loading…</div>}
            {!hasMore && (
              <div className="text-neutral-400 italic">No more questions</div>
            )}
          </div>
        </div>
      </main>

      {/* ---------- Edit Modal ---------- */}
      <EditQuestionModal
        open={editOpen}
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
  question,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  question: Question | null;
  saving: boolean;
  onClose: () => void;
  onSave: (q: Question) => void;
}) => {
  const [form, setForm] = useState<Question | null>(question);

  useEffect(() => {
    setForm(question);
  }, [question]);

  if (!open || !form) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[900px] max-h-[90vh] rounded-xl shadow-xl flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between">
          <h3 className="font-bold text-lg">Edit Question</h3>
          <button onClick={onClose}>×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <textarea
            className="w-full border rounded-md p-3"
            rows={4}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />

          {form.options.map((opt, idx) => (
            <input
              key={idx}
              className="w-full border rounded-md p-2"
              value={opt.text || ""}
              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
              onChange={(e) => {
                const next = [...form.options];
                next[idx] = { ...next[idx], text: e.target.value };
                setForm({ ...form, options: next });
              }}
            />
          ))}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.multiple}
              onChange={(e) => setForm({ ...form, multiple: e.target.checked })}
            />
            Multiple correct answers
          </label>
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose}>Cancel</button>
          <button
            disabled={saving}
            onClick={() => onSave(form)}
            className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleQuizHandler;
