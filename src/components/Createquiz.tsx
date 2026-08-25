import React, { useState, lazy, Suspense, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Trash, Inbox, Loader2 } from "lucide-react";
import CreateQuizModal from "./CreatequizModal";

interface Quiz {
  id: string;
  name: string;
  questions: number;
  quizQuestions: number;
  duration: string;
}

const fetchQuizzes = async (): Promise<Quiz[]> => {
  const res = await fetch("/api/getquizzes", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch quizzes");
  const data = await res.json();
  return data.map((quiz: any) => ({
    id: quiz._id || quiz.id,
    name: quiz.name,
    questions: quiz.totalQuestions || quiz.questions || 0,
    quizQuestions: quiz.quizQuestions,
    duration: quiz.duration || "N/A",
  }));
};

const deleteQuiz = async (id: string) => {
  const res = await fetch(`/api/deletequiz?quizId=${id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete quiz");
};

export default function Createquiz() {
  const [showModal, setShowModal] = useState(false);
  const [deletePopup, setDeletePopup] = useState<{
    show: boolean;
    quizId: string;
    quizName: string;
  }>({
    show: false,
    quizId: "",
    quizName: "",
  });
  const navigate = useNavigate();

  const {
    data: quizzes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Quiz[], Error>({
    queryKey: ["quizzes"],
    queryFn: fetchQuizzes,
    enabled: false,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    refetch();
  }, []);

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deleteQuiz,
    onSuccess: () => {
      refetch();
      setDeletePopup({ show: false, quizId: "", quizName: "" });
    },
  });

  return (
    <div className="w-full h-full flex flex-col bg-zinc-50 font-sans text-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between h-16 bg-white border-b border-zinc-300 px-6 shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight">Create New Quiz</h1>
          <p className="text-sm text-zinc-500">
            Ensure all questions are correct before saving.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-md bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 transition-colors"
          onClick={() => setShowModal(true)}
        >
          Create Quiz
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-zinc-100/50 p-2 md:p-2 overflow-y-auto flex flex-col">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mb-4" />
            <p className="text-sm text-zinc-500">Loading quizzes...</p>
          </div>
        ) : isError ? (
          <p className="text-red-600">Error: {error?.message}</p>
        ) : quizzes.length === 0 ? (
          <EmptyState />
        ) : (
          <QuizTable
            quizzes={quizzes}
            onNavigate={(id) => navigate(`${id}`)}
            onDelete={(e, id, name) =>
              setDeletePopup({ show: true, quizId: id, quizName: name })
            }
          />
        )}
      </main>

      {/* Delete popup */}
      {deletePopup.show && (
        <DeleteConfirmationPopup
          quizName={deletePopup.quizName}
          quizId={deletePopup.quizId}
          onConfirm={(quizId) => deleteMutation.mutate(quizId)}
          onCancel={() =>
            setDeletePopup({ show: false, quizId: "", quizName: "" })
          }
          isDeleting={deleteMutation.isPending}
          error={deleteMutation.error}
        />
      )}

      {/* Lazy modals */}
      {showModal && (
        <CreateQuizModal
          onClose={() => setShowModal(false)}
          refreshQuizzes={refetch}
        />
      )}


    </div>
  );
}

const EmptyState = React.memo(() => (
  <div className="flex-1 w-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-white border border-zinc-200 border-dashed rounded-xl shadow-sm">
    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
      <Inbox className="w-6 h-6 text-zinc-400" />
    </div>
    <h3 className="text-sm font-semibold text-zinc-900 mb-1">No quizzes available</h3>
    <p className="text-sm text-zinc-500 text-center max-w-sm">
      You haven't created any quizzes yet. Click "Create Quiz" to get started.
    </p>
  </div>
));

interface QuizTableProps {
  quizzes: Quiz[];
  onNavigate: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}

const QuizTable = React.memo(
  ({ quizzes, onNavigate, onDelete }: QuizTableProps) => (
    <div className="overflow-hidden rounded-md border border-gray-300 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-black/90 text-gray-300">
          <tr>
            <th className="px-4 py-2 text-left">#</th>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-center">Total Questions</th>
            <th className="px-4 py-2 text-center">Questions/Quiz</th>
            <th className="px-4 py-2 text-center">Duration</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {quizzes.map((quiz, index) => (
            <tr
              key={quiz.id}
              onClick={() => onNavigate(quiz.id)}
              className="border-t border-gray-200 hover:bg-gray-50 transition cursor-pointer"
            >
              <td className="px-4 py-2">{index + 1}</td>
              <td className="px-4 py-2">{quiz.name}</td>
              <td className="px-4 py-2 text-center">{quiz.questions}</td>
              <td className="px-4 py-2 text-center">{quiz.quizQuestions}</td>
              <td className="px-4 py-2 text-center">{quiz.duration}</td>
              <td className="px-4 py-2 flex justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(e, quiz.id, quiz.name);
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                  title="Delete quiz"
                >
                  <Trash size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
);

interface DeleteConfirmationPopupProps {
  quizName: string;
  quizId: string;
  onConfirm: (quizId: string) => void;
  onCancel: () => void;
  isDeleting: boolean;
  error: Error | null;
}

const DeleteConfirmationPopup = React.memo(
  ({
    quizName,
    quizId,
    onConfirm,
    onCancel,
    isDeleting,
    error,
  }: DeleteConfirmationPopupProps) => {
    const [inputValue, setInputValue] = useState("");
    const isDeleteEnabled = inputValue.toLowerCase() === "delete";

    return (
      <div className="fixed inset-0 z-20 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-[480px] max-w-full mx-4">
          <h2 className="text-xl font-bold mb-4 text-red-600">Delete Quiz</h2>
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete the quiz "{quizName}"? This action
            cannot be undone.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Type <strong>delete</strong> to confirm:
          </p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Type 'delete' to confirm"
            disabled={isDeleting}
          />
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">
                <strong>Error:</strong> {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(quizId)}
              disabled={!isDeleteEnabled || isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  },
);
