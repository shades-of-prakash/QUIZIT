import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { MoveLeft, Clock, ListChecks, Pencil } from "lucide-react";

interface Option {
  text?: string | null;
  image?: string | null;
}

interface Question {
  sno: string;
  question: string;
  questionImage?: string;
  options: Option[];
  correct_options: number[];
  multiple: boolean;
}

interface QuizDetails {
  _id: string;
  name: string;
  duration: number;
  totalQuestions: number;
  quizQuestions: number;
  questions: Question[];
  createdAt: string;
}

const SingleQuizHandler: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const questionsPerPage = 5;

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch("/api/quizdetails", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: id }),
        });

        if (!res.ok) throw new Error("Failed to fetch quiz");
        const data = await res.json();
        setQuiz(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!quiz) return <p>No quiz found</p>;

  const startIndex = (page - 1) * questionsPerPage;
  const currentQuestions = quiz.questions.slice(
    startIndex,
    startIndex + questionsPerPage,
  );
  const totalPages = Math.ceil(quiz.questions.length / questionsPerPage);

  const maxOptions = Math.max(...quiz.questions.map((q) => q.options.length));

  return (
    <div className="w-full flex flex-col h-full p-3 gap-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center p-2 gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 border border-neutral-300 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            <MoveLeft size={16} />
          </button>
          <h2 className="text-xl font-semibold">{quiz.name}</h2>
        </div>

        <div className="flex gap-5 items-center text-neutral-700">
          <div className="flex items-center gap-1">
            <Clock size={18} className="text-neutral-500" />
            <span>{quiz.duration} min</span>
          </div>
          <div className="flex items-center gap-1">
            <ListChecks size={18} className="text-neutral-500" />
            <span>{quiz.totalQuestions}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full h-[560px] overflow-y-scroll border border-neutral-800 rounded-lg shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-800 text-white sticky top-0">
            <tr>
              <th className="px-4 py-3">S.No</th>
              <th className="px-4 py-3">Question</th>
              {Array.from({ length: maxOptions }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  Option {i + 1}
                </th>
              ))}
              <th className="px-4 py-3">Multiple</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-300">
            {currentQuestions.map((q) => (
              <tr key={q.sno} className="hover:bg-neutral-50">
                <td className="px-4 py-3">{q.sno}</td>

                {/* Question cell */}
                <td className="px-4 py-3 max-w-[350px]">
                  <div className="flex flex-col gap-2">
                    <span>{q.question}</span>

                    {q.questionImage && (
                      <img
                        src={q.questionImage}
                        alt="question"
                        className="max-h-[120px] object-contain border rounded"
                      />
                    )}
                  </div>
                </td>

                {/* Options */}
                {Array.from({ length: maxOptions }).map((_, i) => {
                  const opt = q.options[i];
                  return (
                    <td key={i} className="px-4 py-3">
                      {opt ? (
                        <div className="flex flex-col gap-1">
                          {opt.text && <span>{opt.text}</span>}
                          {opt.image && (
                            <img
                              src={opt.image}
                              alt={`opt-${i}`}
                              className="max-h-[100px] object-contain border rounded"
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-400">N/A</span>
                      )}
                    </td>
                  );
                })}

                {/* Multiple */}
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      q.multiple
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {q.multiple ? "Yes" : "No"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/edit-question/${q.sno}`)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span>
          Page {page} of {totalPages}
        </span>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="border rounded-md px-3 py-1 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border rounded-md px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleQuizHandler;
