import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useMemo,
	type ReactNode,
} from "react";

export interface QuizOption {
	id: string;
	name: string;
	teamSize: number;
	duration: number;
	quizQuestions: any[];
}

export interface QuizSelectOption {
	label: string;
	value: string;
	teamSize: number;
}

interface QuizContextType {
	quizOptions: QuizOption[];
	quizSelectOptions: QuizSelectOption[];
	errors: { global?: string };
	loading: boolean;
	reloadQuizzes: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

interface QuizApiResponse {
	success: boolean;
	data: QuizOption[];
}

export const QuizProvider = ({ children }: { children: ReactNode }) => {
	const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);
	const [quizSelectOptions, setQuizSelectOptions] = useState<
		QuizSelectOption[]
	>([]);
	const [errors, setErrors] = useState<{ global?: string }>({});
	const [loading, setLoading] = useState(false);

	const fetchQuizNames = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/quiznames");
			if (!res.ok) throw new Error("Failed to fetch quiz names");

			const data: QuizApiResponse = await res.json();

			if (data.success) {
				setQuizOptions(data.data);

				const selectOptions = data.data.map((quiz) => ({
					label: quiz.name,
					value: quiz.id,
					teamSize: quiz.teamSize,
				}));
				setQuizSelectOptions(selectOptions);

				setErrors({});
			} else {
				setErrors({ global: "Failed to load quizzes from server." });
			}
		} catch (err) {
			setErrors({ global: "Could not load quizzes. Please try again later." });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchQuizNames();
	}, []);

	const contextValue = useMemo(
		() => ({
			quizOptions,
			quizSelectOptions,
			errors,
			loading,
			reloadQuizzes: fetchQuizNames,
		}),
		[quizOptions, quizSelectOptions, errors, loading]
	);

	return (
		<QuizContext.Provider value={contextValue}>{children}</QuizContext.Provider>
	);
};

export const useQuiz = () => {
	const context = useContext(QuizContext);
	if (!context) {
		throw new Error("useQuiz must be used within a QuizProvider");
	}
	return context;
};
