import React, { useState, useEffect, useCallback } from "react";
import { TriangleAlert } from "lucide-react";

// Mock components for demonstration
const Slider = ({ total, active, setActive, selectedOptions, skippedQuestions }) => (
  <div className="flex gap-1">
    {Array.from({ length: total }, (_, i) => (
      <button
        key={i}
        onClick={() => setActive(i)}
        className={`w-6 h-6 rounded text-xs ${
          i === active 
            ? 'bg-blue-500 text-white' 
            : selectedOptions[i]?.length > 0
            ? 'bg-green-500 text-white'
            : skippedQuestions.has(i)
            ? 'bg-yellow-500 text-white'
            : 'bg-gray-300'
        }`}
      >
        {i + 1}
      </button>
    ))}
  </div>
);

const Timer = ({ userId, quizId, onTimeUp, onWarn }) => {
  const [time, setTime] = useState(1200); // 20 minutes for demo
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        if (prev === 21) {
          onWarn();
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [onTimeUp, onWarn]);
  
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  
  return (
    <div className="text-lg font-mono">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
};

const WarningModal = ({ open, message, onClose }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[380px] p-6 text-center animate-fadeIn">
        <div className="flex flex-col items-center justify-center gap-2 mb-4">
          <TriangleAlert size={48} className="text-amber-500" />
          <h2 className="text-2xl font-semibold text-amber-700">Warning</h2>
        </div>
        <p className="flex flex-col gap-1 mb-6 text-sm text-gray-700 leading-relaxed p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span>
            You have exited fullscreen
            <span className="font-semibold mx-1">{message} out of 3</span>
            times.
          </span>
          <span>If it happens again, your quiz will be</span>
          <span className="font-semibold text-red-600">auto-submitted</span>
        </p>
        <button
          onClick={onClose}
          className="w-full px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-md transition-colors"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

// Mock user and navigation
const mockUser = {
  _id: "user123",
  quizId: "quiz456",
  participant1Name: "John Doe",
  participant1RollNo: "12345",
  email: "john@example.com"
};

const mockQuestions = [
  {
    sno: "1",
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    multiple: false,
    user_options: []
  },
  {
    sno: "2",
    question: "Which of the following are programming languages? (Select multiple)",
    options: ["JavaScript", "HTML", "Python", "CSS", "Java"],
    multiple: true,
    user_options: []
  },
  {
    sno: "3",
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    multiple: false,
    user_options: []
  }
];

const Quiz = () => {
  const user = mockUser;

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(true); // Set to true for demo

  const [questions, setQuestions] = useState(mockQuestions);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(1200);
  const [skippedQuestions, setSkippedQuestions] = useState(new Set());

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Mock functions
  const toast = {
    error: (msg) => console.log("ERROR:", msg),
    warning: (msg) => console.log("WARNING:", msg),
    success: (msg) => console.log("SUCCESS:", msg)
  };

  const navigate = (path) => console.log("Navigate to:", path);

  const saveSessionState = useCallback(async (updatedQuestions) => {
    // Mock save - in real app this would be an API call
    console.log("Saving session state...");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;

    setSubmitting(true);
    
    // Mock submission
    setTimeout(() => {
      setSubmitted(true);
      toast.success("✅ Quiz submitted successfully!");
      navigate("/submission");
    }, 1000);
  }, [submitting, submitted]);

  const handleTimeUp = useCallback(() => {
    toast.warning("⏰ Time is up! Auto-submitting your answers.");
    handleSubmit();
  }, [handleSubmit]);

  const handleTimerWarning = useCallback(() => {
    toast.warning("⚠️ Only 20 seconds left! Hurry up.");
  }, []);

  // ✅ FIXED: Improved fullscreen detection with better state management
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Check if we're NOT in fullscreen and session is loaded
      if (!document.fullscreenElement && sessionLoaded && !submitted) {
        console.log("Fullscreen exited, current count:", tabSwitchCount);
        
        setTabSwitchCount((prevCount) => {
          const newCount = prevCount + 1;
          console.log("New count will be:", newCount);
          
          if (newCount < 3) {
            // Use setTimeout to ensure state updates properly
            setTimeout(() => {
              setWarningMessage(newCount.toString());
              setShowWarning(true);
            }, 100);
          } else {
            toast.error("🚨 You exited fullscreen 3 times. Auto-submitting quiz.");
            handleSubmit();
          }
          
          return newCount;
        });
      }
    };

    // Use only the standard fullscreen event
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    // Add other vendor prefixes if needed
    if (document.webkitFullscreenElement !== undefined) {
      document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    }
    if (document.mozFullScreenElement !== undefined) {
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    }
    if (document.msFullscreenElement !== undefined) {
      document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [sessionLoaded, submitted, handleSubmit, tabSwitchCount]);

  const handleOptionChange = useCallback((optionIndex) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      const currentQuestion = { ...updatedQuestions[activeQuestion] };
      const isMultiple = currentQuestion.multiple;
      const currentOptions = [...(currentQuestion.user_options || [])];

      if (isMultiple) {
        if (currentOptions.includes(optionIndex)) {
          currentQuestion.user_options = currentOptions.filter(
            (i) => i !== optionIndex
          );
        } else {
          currentQuestion.user_options = [...currentOptions, optionIndex];
        }
      } else {
        currentQuestion.user_options = [optionIndex];
      }

      updatedQuestions[activeQuestion] = currentQuestion;
      saveSessionState(updatedQuestions);

      setSkippedQuestions((prev) => {
        const updated = new Set(prev);
        if (!currentQuestion.user_options || currentQuestion.user_options.length === 0) {
          updated.add(activeQuestion);
        } else {
          updated.delete(activeQuestion);
        }
        return updated;
      });

      return updatedQuestions;
    });
  }, [activeQuestion, saveSessionState]);

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
    if (activeQuestion < questions.length - 1) {
      setActiveQuestion(activeQuestion + 1);
    }
  }, [updateSkippedForCurrent, activeQuestion, questions.length]);

  const handlePrevious = useCallback(() => {
    updateSkippedForCurrent();
    if (activeQuestion > 0) {
      setActiveQuestion(activeQuestion - 1);
    }
  }, [updateSkippedForCurrent, activeQuestion]);

  const handleSetActive = useCallback((i) => {
    updateSkippedForCurrent();
    setActiveQuestion(i);
  }, [updateSkippedForCurrent]);

  // Test function to simulate fullscreen exit
  const testFullscreenExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      // Simulate the event for testing
      const event = new Event('fullscreenchange');
      document.dispatchEvent(event);
    }
  };

  if (!sessionLoaded || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  const selectedOptions = {};
  questions.forEach((q, index) => {
    selectedOptions[index] = q.user_options || [];
  });

  return (
    <>
      {/* ✅ Warning Modal - This should now show properly */}
      <WarningModal
        open={showWarning}
        message={warningMessage}
        onClose={() => setShowWarning(false)}
      />

      <div className="w-screen h-dvh flex flex-col gap-2 overflow-hidden">
        {/* HEADER */}
        <div className="w-full bg-white flex justify-between items-center px-4 py-3">
          <div className="flex gap-2 items-center">
            <h1 className="text-2xl font-bold">
              QUIZ<span className="text-red-500">IT</span>
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
              onClick={handleSubmit}
              disabled={submitting || submitted}
              className={`px-5 py-2 rounded-md text-white ${
                submitted
                  ? "bg-gray-500 cursor-not-allowed"
                  : submitting
                  ? "bg-red-400 cursor-wait"
                  : "bg-red-800 hover:bg-red-900"
              }`}
            >
              {submitted ? "Submitted" : submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>

        {/* Test button for fullscreen exit simulation */}
        <div className="px-4">
          <button
            onClick={testFullscreenExit}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md text-sm"
          >
            Test Fullscreen Exit (Count: {tabSwitchCount})
          </button>
        </div>

        {/* MAIN QUIZ */}
        <div className="w-full flex flex-1 px-4">
          <div className="flex w-full h-[600px] border border-neutral-800/20 rounded-md overflow-hidden">
            {/* QUESTION */}
            <div className="w-1/2 bg-neutral-50 p-10 flex flex-col gap-4">
              <span className="font-semibold">Question {activeQuestion + 1}</span>
              <div className="font-semibold overflow-auto">
                {questions[activeQuestion]?.question ?? ""}
              </div>
            </div>

            {/* OPTIONS */}
            <div className="w-1/2 flex flex-col p-10 gap-3">
              <span className="font-semibold">Answer</span>
              <div className="flex flex-col gap-6 overflow-auto">
                {questions[activeQuestion]?.options?.map((opt, i) => {
                  const isChecked =
                    questions[activeQuestion]?.user_options?.includes(i) || false;
                  const isMultiple = questions[activeQuestion]?.multiple ?? false;
                  const id = `quiz-${activeQuestion}-${i}`;

                  return (
                    <div
                      key={i}
                      className={`hover:bg-neutral-100 flex gap-2 items-center border border-neutral-800/30 rounded-md px-4 py-3 cursor-pointer transition-colors ${
                        isChecked ? "!border-black bg-neutral-100" : ""
                      }`}
                      onClick={() => handleOptionChange(i)}
                    >
                      <input
                        type={isMultiple ? "checkbox" : "radio"}
                        id={id}
                        name={!isMultiple ? `quiz-${activeQuestion}` : undefined}
                        className="w-5 h-5 accent-black rounded focus:ring-0 focus:border-black"
                        checked={isChecked}
                        onChange={() => handleOptionChange(i)}
                      />
                      <label
                        htmlFor={id}
                        className="text-neutral-800 select-none cursor-pointer flex-1"
                      >
                        {opt}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER NAV */}
        <div className="w-full flex justify-end mb-10 gap-3 px-4 py-2">
          <button
            onClick={handlePrevious}
            disabled={activeQuestion === 0}
            className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={activeQuestion === questions.length - 1}
            className="bg-red-500 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-white"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default Quiz;