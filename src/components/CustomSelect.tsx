import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
interface CustomSelectProps {
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string }[];
	placeholder?: string;
	className?: string;
	stylePropsOfSelect?:string;
}
function CustomSelect({
	value,
	onChange,
	options,
	placeholder,
	className = "",
	stylePropsOfSelect
}: CustomSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const selectRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				selectRef.current &&
				!selectRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const selectedOption = options.find((option) => option.value === value);

	return (
		<div className={`relative ${className}`} ref={selectRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={`w-full border border-neutral-800/30  ${stylePropsOfSelect||"px-4 py-2"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between bg-white hover:bg-neutral-50 transition-colors`}
			>
				<span className={selectedOption ? "text-black" : "text-neutral-500"}>
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<ChevronDown
					className={`w-4 h-4 text-neutral-600 transition-transform duration-200 ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{isOpen && (
				<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
					{options.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => {
								onChange(option.value);
								setIsOpen(false);
							}}
							className={`w-full px-4 py-2 ${stylePropsOfSelect} text-left hover:bg-neutral-100 transition-colors first:rounded-t-md last:rounded-b-md ${
								value === option.value
									? "bg-blue-50 text-blue-700"
									: "text-black"
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
export default CustomSelect;
