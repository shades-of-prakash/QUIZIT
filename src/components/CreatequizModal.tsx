import { useState, type ChangeEvent } from "react";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";
import CustomSelect from "./CustomSelect";

interface CreateQuizModalProps {
  onClose: () => void;
  refreshQuizzes: () => void;
}

export default function CreateQuizModal({
  onClose,
  refreshQuizzes,
}: CreateQuizModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [quizName, setQuizName] = useState("");
  const [questions, setQuestions] = useState("");
  const [duration, setDuration] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [loading, setLoading] = useState(false);

  const teamSizeOptions = [
    { value: "1", label: "Individual" },
    { value: "2", label: "Duo" },
  ];

  /* ---------- FILE HANDLERS ---------- */

  const handleCsvChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Only .csv files are allowed");
      e.target.value = "";
      return;
    }

    try {
      // Strict UTF-8 validation
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder("utf-8", { fatal: true });
      decoder.decode(buffer);

      setCsvFile(file);
    } catch {
      toast.error(
        "Invalid file encoding. Please upload a UTF-8 encoded CSV file.",
      );
      e.target.value = "";
      setCsvFile(null);
    }
  };

  /* ---------- SUBMIT ---------- */

  const isFormValid =
    csvFile &&
    quizName.trim() &&
    questions.trim() &&
    duration.trim() &&
    teamSize.trim();

  const handleCreateQuiz = async () => {
    if (!isFormValid) return;

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("csv", csvFile!);
      formData.append("name", quizName);
      formData.append("duration", duration);
      formData.append("quizQuestions", questions);
      formData.append("teamSize", teamSize);

      const res = await fetch("/api/create-quiz", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Quiz created successfully");
      refreshQuizzes();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-xl shadow-lg p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950">Create New Quiz</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* FILE INPUTS */}
        <div className="flex items-center gap-3">
          <FileBox
            icon={<Upload size={20} />}
            title="Upload quiz.csv"
            subtitle="UTF-8 required"
            file={csvFile}
            accept=".csv"
            onChange={handleCsvChange}
          />

        </div>

        {/* FORM FIELDS */}
        <div className="space-y-4">
          <Input label="Quiz name" value={quizName} onChange={setQuizName} />
          <Input
            label="Number of questions"
            type="number"
            value={questions}
            onChange={setQuestions}
          />
          <Input
            label="Duration (minutes)"
            type="number"
            value={duration}
            onChange={setDuration}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-950 leading-none">Team size</label>
            <CustomSelect
              value={teamSize}
              onChange={setTeamSize}
              options={teamSizeOptions}
              placeholder="Select"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            disabled={!isFormValid || loading}
            onClick={handleCreateQuiz}
            className={`inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-md transition-colors ${
              isFormValid
                ? "bg-zinc-900 text-zinc-50 shadow-sm hover:bg-zinc-900/90"
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Creating..." : "Create Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function Input({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-950 leading-none">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 py-1 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-colors"
      />
    </div>
  );
}

function FileBox({ icon, title, subtitle, file, accept, onChange }: any) {
  return (
    <label className="w-full h-full border border-dashed border-zinc-300 rounded-lg py-4 px-3 text-center cursor-pointer hover:border-zinc-950 transition-colors bg-zinc-50/50 hover:bg-zinc-100/50">
      <div className="flex flex-col items-center gap-1">
        <div className="text-zinc-500">{icon}</div>
        <p className="text-sm font-medium text-zinc-950 mt-1">{title}</p>
        <p className="text-xs text-zinc-500">{subtitle}</p>
        <input type="file" accept={accept} hidden onChange={onChange} />
        {file && <p className="text-xs font-semibold text-green-600 mt-2 truncate w-full px-2">{file.name}</p>}
      </div>
    </label>
  );
}
