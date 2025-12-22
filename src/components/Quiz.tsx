import React, { useState, useEffect, useCallback, useRef } from "react";
import Slider from "./Slider";
import Timer from "./Timer";
import { useUserAuth } from "../context/userAuthContext";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import WarningModal from "./WarningModal";
import SubmitConfirmModal from "./SubmitConfirmModal";
import CodeBlock from "./CodeBlock";
import Loader from "./Loader";
import debounce from "lodash/debounce";
import { ArrowLeftToLine, ArrowRightToLine } from "lucide-react";

type Option = {
  text?: string | null;
  image?: string | null;
};

type Question = {
  sno?: string;
  question?: string;
  questionImage?: string;
  options?: Option[];
  multiple?: boolean;
  user_options?: number[];
};

const Quiz: React.FC = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(
    new Set(),
  );

  const [tabSwitchCount, setTabSwitchCount] = useState(-1);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const incrementLock = useRef(false);

  // 🔹 Load session

  const initializeSession = useCallback(async () => {
    if (!user) return; // wait for user

    if (!user.quizId) {
      toast.error("No active session found");
      navigate("/");
      return;
    }

    try {
      const res = await fetch(
        `/api/get-session?userId=${user._id}&quizId=${user.quizId}`,
        { credentials: "include" },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch session");
      }

      const data = await res.json();

      setQuestions(data.questions || []);
      setRemainingSeconds(data.remainingSeconds || 0);
      setActiveQuestion(data.activeQuestion || 0);
      setSkippedQuestions(new Set(data.skippedQuestions || []));
      setSessionLoaded(true);
    } catch (error: any) {
      console.error("Failed to load session:", error);
      toast.error(error.message || "No active session found");
      navigate("/");
    }
  }, [user, navigate]);

  const saveSessionState = useCallback(
    async (updatedQuestions?: Question[]) => {
      if (!user || !user.quizId || !sessionLoaded) return;

      const questionsToSave = updatedQuestions || questions;

      try {
        await fetch("/api/save-session-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            quizId: user.quizId,
            questions: questionsToSave,
            activeQuestion,
            skippedQuestions: Array.from(skippedQuestions),
          }),
          credentials: "include",
        });
      } catch (error) {
        console.error("Failed to save session state:", error);
        toast.error("Failed to save progress");
      }
    },
    [user, sessionLoaded, activeQuestion, skippedQuestions, questions],
  );

  // 🔹 Submit quiz
  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;

    if (!user || !user.quizId) {
      toast.error("User or quiz not found!");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          quizId: user.quizId,
          participant1Name: user.participant1Name,
          participant1RollNo: user.participant1RollNo,
          participant2Name: user.participant2Name,
          participant2RollNo: user.participant2RollNo,
          email: user.email,
          questions,
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to submit quiz");

      await res.json();
      setSubmitted(true);
      toast.success("✅ Quiz submitted successfully!");
      navigate("/submission");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit quiz. Please try again.");
      setSubmitting(false);
    }
  }, [submitting, submitted, user, questions, navigate]);

  // 🔹 Timer callbacks
  const handleTimeUp = useCallback(() => {
    if (submitting || submitted) return;
    toast.warning("Time is up! Auto-submitting your answers.");
    handleSubmit();
  }, [handleSubmit]);

  const handleTimerWarning = useCallback(() => {
    toast.warning("Only 20 seconds left! Hurry up.");
  }, []);

  // 🔹 Session load
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const incrementTabSwitchCount = useCallback(async () => {
    if (incrementLock.current) return; // prevent rapid calls
    incrementLock.current = true;

    if (!user || !user.quizId) return;

    try {
      const res = await fetch("/api/update-tab-switch-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, quizId: user.quizId }),
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to update tab switch count");
        return;
      }

      const data = await res.json();
      console.log("count", data.tabSwitchCount);
      setTabSwitchCount(data.tabSwitchCount ?? 0);

      if (data.tabSwitchCount && data.tabSwitchCount <= 3) {
        setWarningMessage(`Warning ${data.tabSwitchCount}`);
        setShowWarning(true);
      } else if (data.tabSwitchCount > 3) {
        toast.error(
          "You exited fullscreen or switched tabs 3 times. Auto-submitting quiz.",
        );
        handleSubmit();
      }
    } catch (error) {
      console.error("Error updating tab switch count:", error);
    }
    setTimeout(() => {
      incrementLock.current = false;
    }, 1000);
  }, [user, handleSubmit]);

  useEffect(() => {
    const handleExit = () => {
      if (
        (document.hidden || !document.fullscreenElement) &&
        sessionLoaded &&
        !submitted
      ) {
        incrementTabSwitchCount();
      }
    };

    document.addEventListener("visibilitychange", handleExit);
    document.addEventListener("fullscreenchange", handleExit);

    return () => {
      document.removeEventListener("visibilitychange", handleExit);
      document.removeEventListener("fullscreenchange", handleExit);
    };
  }, [sessionLoaded, submitted, incrementTabSwitchCount]);

  const handleOptionChange = useCallback(
    (optionIndex: number) => {
      setQuestions((prevQuestions) => {
        const updatedQuestions = [...prevQuestions];
        const current = { ...updatedQuestions[activeQuestion] };
        const isMultiple = current.multiple;
        const currentOptions = [...(current.user_options || [])];

        if (isMultiple) {
          if (currentOptions.includes(optionIndex)) {
            current.user_options = currentOptions.filter(
              (i) => i !== optionIndex,
            );
          } else {
            current.user_options = [...currentOptions, optionIndex];
          }
        } else {
          current.user_options = [optionIndex];
        }

        updatedQuestions[activeQuestion] = current;
        saveSessionState(updatedQuestions);

        setSkippedQuestions((prev) => {
          const updated = new Set(prev);
          if (!current.user_options || current.user_options.length === 0) {
            updated.add(activeQuestion);
          } else {
            updated.delete(activeQuestion);
          }
          return updated;
        });

        return updatedQuestions;
      });
    },
    [activeQuestion, saveSessionState],
  );

  // 🔹 Navigation helpers
  const updateSkippedForCurrent = useCallback(() => {
    setSkippedQuestions((prev) => {
      const updated = new Set(prev);
      const current = questions[activeQuestion];
      if (!current?.user_options || current.user_options.length === 0) {
        updated.add(activeQuestion);
      } else {
        updated.delete(activeQuestion);
      }
      return updated;
    });
    saveSessionState();
  }, [questions, activeQuestion, saveSessionState]);

  const handleNext = useCallback(() => {
    updateSkippedForCurrent();
    if (activeQuestion < questions.length - 1)
      setActiveQuestion(activeQuestion + 1);
  }, [updateSkippedForCurrent, activeQuestion, questions.length]);

  const handlePrevious = useCallback(() => {
    updateSkippedForCurrent();
    if (activeQuestion > 0) setActiveQuestion(activeQuestion - 1);
  }, [updateSkippedForCurrent, activeQuestion]);

  const handleSetActive = useCallback(
    (i: number) => {
      updateSkippedForCurrent();
      setActiveQuestion(i);
    },
    [updateSkippedForCurrent],
  );

  if (!sessionLoaded) {
    return <Loader />;
  }

  const selectedOptions: Record<number, number[]> = {};
  questions.forEach((q, index) => {
    selectedOptions[index] = q.user_options || [];
  });

  return (
    <>
      <WarningModal
        open={showWarning}
        message={warningMessage}
        onClose={() => setShowWarning(false)}
      />

      <SubmitConfirmModal
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          setTimeout(() => handleSubmit(), 0);
        }}
      />
      <div className="w-screen  h-screen flex flex-col">
        {/* HEADER */}
        <div className="w-full h-20 flex justify-between items-center px-4">
          <div className="flex gap-2 items-center">
            <h1 className="text-2xl font-bold">
              QUIZ<span className="text-accent">IT</span>
            </h1>
            <div className="text-[10px] p-1 font-semibold bg-neutral-200 rounded-md">
              RVR&JC
            </div>
          </div>
          <div className="ml-32">
            <Slider
              total={questions.length}
              active={activeQuestion}
              setActive={handleSetActive}
              selectedOptions={selectedOptions}
              skippedQuestions={skippedQuestions}
            />
          </div>
          <div className="h-15 flex-shrink-0 flex items-center gap-4">
            <Timer
              userId={user?._id ?? ""}
              quizId={user?.quizId ?? ""}
              onTimeUp={handleTimeUp}
              onWarn={handleTimerWarning}
            />
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting || submitted}
              className={`px-5 py-2 rounded-md text-white ${
                submitted
                  ? "bg-gray-500 cursor-not-allowed"
                  : submitting
                    ? "bg-red-400 cursor-wait"
                    : "bg-red-800 hover:bg-red-900"
              }`}
            >
              {submitted
                ? "Submitted"
                : submitting
                  ? "Submitting..."
                  : "Submit"}
            </button>
          </div>
        </div>

        {/* MAIN QUIZ */}
        <div className="w-full h-[calc(100%-5rem)] flex flex-1">
          <div className=" h-full flex w-full flex-1 border border-neutral-800/20 rounded-md overflow-auto">
            {/* QUESTION */}
            <div className="w-1/2 h-full p-5 border-r  border-gray-300  flex flex-col gap-4 ">
              {/* bg-neutral-50 */}
              <span className="font-semibold ">
                Question {activeQuestion + 1}
              </span>
              <div className="flex flex-col gap-4 flex-1 overflow-auto">
                {/* Question text / code */}
                {questions[activeQuestion]?.question && (
                  <CodeBlock
                    raw={questions[activeQuestion]?.question ?? ""}
                    image={questions[activeQuestion].questionImage ?? null}
                  />
                )}

                {/* Question image (shown between text and code naturally) */}
              </div>
            </div>

            <div className="w-1/2 h-full flex flex-col">
              <div className="w-full flex h-[60px] justify-between items-center gap-3 px-4 py-2 sticky bottom-0">
                <span>Answer</span>
                <div className="flex gap-2">
                  <button
                    disabled={activeQuestion === 0}
                    onClick={handlePrevious}
                    className="bg-black text-white h-8 px-3 text-sm flex gap-2 items-center rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <ArrowLeftToLine size={14} /> Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={activeQuestion === questions.length - 1}
                    className="bg-black  text-white h-8 px-3 rounded-md text-sm  flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    Next <ArrowRightToLine size={14} />
                  </button>
                </div>
              </div>
              {/* OPTIONS */}
              <div className="w-full h-[calc(100%-60px)] flex flex-col px-5 py-4 gap-3">
                <div className="flex flex-col gap-6 overflow-auto">
                  {questions[activeQuestion]?.options?.map((opt, i) => {
                    const isChecked =
                      questions[activeQuestion]?.user_options?.includes(i) ||
                      false;
                    const isMultiple =
                      questions[activeQuestion]?.multiple ?? false;
                    const id = `quiz-${activeQuestion}-${i}`;

                    return (
                      <div
                        key={i}
                        onClick={() => handleOptionChange(i)}
                        className={`hover:bg-neutral-100 flex gap-3 items-start border border-gray-300 rounded-md px-4 py-3 cursor-pointer transition-colors ${
                          isChecked ? "!border-black bg-neutral-100" : ""
                        }`}
                      >
                        <input
                          type={isMultiple ? "checkbox" : "radio"}
                          id={id}
                          name={
                            !isMultiple ? `quiz-${activeQuestion}` : undefined
                          }
                          className="mt-1 w-5 h-5 accent-black"
                          checked={isChecked}
                          onChange={() => handleOptionChange(i)}
                        />

                        <label
                          htmlFor={id}
                          className="flex flex-col gap-2 cursor-pointer"
                        >
                          {/* Option text */}
                          {opt?.text && (
                            <span className="text-black text-base">
                              {opt.text}
                            </span>
                          )}

                          {/* Option image */}
                          {opt?.image && (
                            <img
                              src={opt.image}
                              alt={`Option ${i + 1}`}
                              className="max-w-[100px] max-h-[100px]  object-contain border rounded-md"
                              loading="lazy"
                            />
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Quiz;
