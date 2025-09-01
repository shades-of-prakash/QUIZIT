import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useUserAuth } from "../context/userAuthContext";

const Instructions: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useUserAuth();

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleDropdown = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const startQuiz = () => {
    navigate("/");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const guidelines = [
    [
      "This quiz consists of multiple-choice questions (MCQs) and must be attempted individually by each registered participant.",
      "The total duration will be announced beforehand. The timer starts once you begin and cannot be paused.",
      "The quiz must be attempted in full-screen mode. Exiting full-screen will lead to auto-submission of the quiz.",
      "No internet browsing, search engines, or external study materials are permitted during the quiz.",
      "No tab switching or opening of other applications/software is allowed. Any such attempt will result in auto-submission or disqualification."
    ],
    [
      "Answers are saved automatically but ensure you click 'Submit' before moving to the next question.",
      "Each question can only be attempted once – no reattempts are allowed."
    ],
    [
      "The quiz is monitored/proctored.",
      "Any malpractice or impersonation will result in immediate disqualification.",
      "The decision of the organizers will be final and binding."
    ]
  ];

  return (
    <div className="w-screen h-dvh flex p-10">
      <div className="flex w-full h-full border border-neutral-300 rounded-md overflow-hidden">
        <div className="w-1/2 h-full bg-red-900"></div>
        <div className="w-1/2 h-full flex flex-col">
          <div className="w-full p-2">
            <div className="w-full flex flex-col gap-3">
              <span className="text-xl font-semibold">Guidelines</span>

              {guidelines.map((items, index) => (
                <div
                  key={index}
                  className="bg-neutral-200 border border-neutral-300 rounded-md"
                >
                  <button
                    onClick={() => toggleDropdown(index)}
                    className="w-full text-left px-4 py-2 font-medium flex justify-between items-center"
                  >
                    <span>Key Guidelines {index + 1}</span>
                    <span>{openIndex === index ? "▲" : "▼"}</span>
                  </button>

                  {openIndex === index && (
                    <ul className="">
                      {items.map((point, i) => (
                        <li key={i}><div>&bull;{point}</div></li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={startQuiz}
            className="bg-blue-500 text-white py-2 w-full hover:bg-blue-600 transition"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
