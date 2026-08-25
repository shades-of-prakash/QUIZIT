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
				className={`w-full h-9 flex items-center justify-between border border-zinc-200 ${stylePropsOfSelect||"px-3"} text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 bg-white hover:bg-zinc-50 transition-colors`}
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
				<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-md z-50 max-h-60 overflow-y-auto p-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300">
					{options.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => {
								onChange(option.value);
								setIsOpen(false);
							}}
							className={`w-full px-2 py-1.5 text-sm rounded-sm text-left transition-colors ${
								value === option.value
									? "bg-zinc-100 text-zinc-900 font-medium"
									: "text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900"
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
