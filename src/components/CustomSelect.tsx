import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Option {
	value: string;
	label: string;
}

interface CustomSelectProps {
	url: string; // API endpoint
	onChange: (option: Option) => void;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ url, onChange }) => {
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<Option | null>(null);
	const [options, setOptions] = useState<Option[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (open && options.length === 0) {
			setIsLoading(true);
			setError(false);

			fetch(url)
				.then((res) => {
					if (!res.ok) throw new Error("Failed to fetch options");
					return res.json();
				})
				.then((data) => {
					const opts = data.data.map((q: any) => ({
						value: q.id,
						label: q.name,
					}));
					setOptions(opts);
				})
				.catch(() => setError(true))
				.finally(() => setIsLoading(false));
		}
	}, [open, url, options.length]);

	const handleSelect = (option: Option) => {
		setSelected(option);
		onChange(option);
		setOpen(false);
	};

	return (
		<div className="w-full relative">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="w-full p-3 border border-neutral-800 rounded-md bg-white text-left flex justify-between items-center"
			>
				<span>{selected ? selected.label : "Select a quiz"}</span>
				{open ? (
					<ChevronUp className="h-5 w-5 text-neutral-800" />
				) : (
					<ChevronDown className="h-5 w-5 text-neutral-800" />
				)}
			</button>

			{open && (
				<ul
					className="absolute z-10 mt-1 w-full max-h-28 overflow-y-auto border border-neutral-800 rounded-md bg-white
               scrollbar-thin scrollbar-thumb-transparent scrollbar-track-gray-200"
				>
					{isLoading ? (
						<li className="p-2 rounded-md text-gray-500 flex justify-center items-center">
							Loading...
						</li>
					) : error ? (
						<li className="p-2 rounded-md text-red-500 flex justify-center items-center">
							Error loading quizzes
						</li>
					) : options.length > 0 ? (
						options.map((option) => (
							<li
								key={option.value}
								onClick={() => handleSelect(option)}
								className="p-2 cursor-pointer hover:bg-accent first:rounded-t-md last:rounded-b-md"
								role="option"
								aria-selected={selected?.value === option.value}
							>
								{option.label}
							</li>
						))
					) : (
						<li className="px-2 py-1 rounded-e-md text-gray-500 flex justify-center items-center">
							No options available
						</li>
					)}
				</ul>
			)}
		</div>
	);
};

export default CustomSelect;
