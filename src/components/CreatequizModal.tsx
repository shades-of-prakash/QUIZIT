import { useState, type ChangeEvent } from "react";
import { X, Upload, FileArchive, Image } from "lucide-react";
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
  const [zipFile, setZipFile] = useState<File | null>(null);

  const [hasImages, setHasImages] = useState(false);

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

  const handleZipChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      toast.error("Only .zip files are allowed");
      e.target.value = "";
      return;
    }

    setZipFile(file);
  };

  /* ---------- SUBMIT ---------- */

  const isFormValid =
    csvFile &&
    quizName.trim() &&
    questions.trim() &&
    duration.trim() &&
    teamSize.trim() &&
    (!hasImages || zipFile);

  const handleCreateQuiz = async () => {
    if (!isFormValid) return;

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("csv", csvFile!);
      if (hasImages && zipFile) {
        formData.append("images", zipFile);
      }

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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="w-[520px] bg-white rounded-lg shadow-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create New Quiz</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded"
          >
            <X />
          </button>
        </div>

        {/* Images Toggle */}
        <div className="flex items-center justify-between border rounded-md px-4 py-3">
          <div className="flex items-center gap-3">
            <Image size={18} />
            <div>
              <p className="text-sm font-medium">Includes images</p>
              <p className="text-xs text-neutral-500">
                Questions or options have images
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setHasImages((v) => !v);
              setZipFile(null);
            }}
            className={`w-11 h-6 rounded-full transition relative ${
              hasImages ? "bg-black" : "bg-neutral-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                hasImages ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* FILE INPUTS */}
        <div className="flex items-center gap-3">
          <FileBox
            icon={<Upload />}
            title="Upload quiz.csv"
            subtitle="UTF-8 required"
            file={csvFile}
            accept=".csv"
            onChange={handleCsvChange}
          />

          {hasImages && (
            <FileBox
              icon={<FileArchive />}
              title="Upload images.zip"
              subtitle="Required when images enabled"
              file={zipFile}
              accept=".zip"
              onChange={handleZipChange}
            />
          )}
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
          <div>
            <label className="text-sm font-medium">Team size</label>
            <CustomSelect
              value={teamSize}
              onChange={setTeamSize}
              options={teamSizeOptions}
              placeholder="Select"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            disabled={!isFormValid || loading}
            onClick={handleCreateQuiz}
            className={`px-6 py-2 rounded-md font-medium ${
              isFormValid
                ? "bg-black text-white hover:bg-neutral-800"
                : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
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
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-md focus:ring-1 focus:ring-black focus:outline-none"
      />
    </div>
  );
}

function FileBox({ icon, title, subtitle, file, accept, onChange }: any) {
  return (
    <label className="w-full h-full border border-dashed border-neutral-400 rounded-lg p-4 text-center cursor-pointer hover:border-black transition">
      <div className="flex flex-col items-center gap-1">
        {icon}
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-neutral-500">{subtitle}</p>
        <input type="file" accept={accept} hidden onChange={onChange} />
        {file && <p className="text-xs font-semibold mt-1">{file.name}</p>}
      </div>
    </label>
  );
}
