import { useState, useEffect } from "react";
import CreateQuizModal from "./CreatequizModal";

interface Quiz {
  id: string; 
  name: string;
  questions: number;
  duration: string;
}

export default function Createquiz() {
  const [showModal, setShowModal] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModal = () => {
    setShowModal((prev) => !prev);
  };
  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/quizzes", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch quizzes");
        }
        const data = await response.json();
		console.log(data)
        const formatted = data.map((quiz: any) => ({
          id: quiz._id || quiz.id,
          name: quiz.name,
          questions: quiz.totalQuestions || quiz.questions || 0,
          duration: quiz.duration || "N/A",
        }));

        setQuizzes(formatted);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchQuizzes();
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-green-950">
      {/* Header */}
      <div className="flex items-center justify-between h-14 bg-white border-b border-neutral-100 p-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">Create New Quiz</h1>
          <span className="text-sm">
            Make sure all questions are correct before saving.
          </span>
        </div>
        <button
          className="bg-black text-white px-4 py-2 rounded-md"
          onClick={handleModal}
        >
          Create Quiz
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white p-4 overflow-x-auto">
        {loading ? (
          <p>Loading quizzes...</p>
        ) : error ? (
          <p className="text-red-600">Error: {error}</p>
        ) : (
          <div className="rounded-md overflow-hidden border border-gray-300 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-center">Number of Questions</th>
                  <th className="px-4 py-2 text-center">Duration</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz, index) => (
                  <tr
                    key={quiz.id}
                    className="border-t border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{quiz.name}</td>
                    <td className="px-4 py-2 text-center">{quiz.questions}</td>
                    <td className="px-4 py-2 text-center">{quiz.duration}</td>
                    <td className="px-4 py-2 flex gap-2 justify-center">
                      <button className="border border-green-600 text-green-700 hover:bg-accent hover:text-black rounded-md px-3 py-1 transition">
                        Create Users
                      </button>
                      <button className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-md transition">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && <CreateQuizModal onClose={handleModal} />}
    </div>
  );
}
