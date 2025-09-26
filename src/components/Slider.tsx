import React, { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";

interface SliderProps {
	total: number;
	active: number;
	setActive: (index: number) => void;
	selectedOptions: { [key: number]: number[] };
	skippedQuestions: Set<number>;
}
const Slider: React.FC<SliderProps> = ({
	total,
	active,
	setActive,
	selectedOptions,
	skippedQuestions,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);

	const handleDropDown = () => {
		setOpen((prev) => !prev);
	};

	const scrollLeft = () => {
		containerRef.current?.scrollBy({ left: -40, behavior: "smooth" });
	};

	const scrollRight = () => {
		containerRef.current?.scrollBy({ left: 40, behavior: "smooth" });
	};

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		}
		if (open) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [open]);

	useEffect(() => {
		const activeItem = itemRefs.current[active];
		if (activeItem && containerRef.current) {
			activeItem.scrollIntoView({
				behavior: "smooth",
				inline: "center",
				block: "nearest",
			});
		}
	}, [active]);

	return (
		<div className="flex items-center gap-2 relative">
			<div
				onClick={scrollLeft}
				className="w-10 h-10 px-2 py-1 bg-gray-100 hover:bg-gray-300 rounded flex items-center justify-center cursor-pointer"
			>
				<ChevronLeft size={32} />
			</div>

			<div
				ref={containerRef}
				className="w-[232px] flex overflow-x-hidden gap-2"
				style={{ scrollSnapType: "x mandatory" }}
			>
				{Array.from({ length: total }).map((_, i) => {
					const isSelected = (selectedOptions[i] ?? []).length > 0;
					const isSkipped = skippedQuestions.has(i);

					return (
						<div
							key={i}
							ref={(el) => {
								itemRefs.current[i] = el;
							}}
							onClick={() => setActive(i)}
							className={`border select-none border-neutral-300 rounded-md w-10 h-10 flex items-center justify-center flex-shrink-0 cursor-pointer
								${active === i ? "!bg-black !text-white" : ""}
								${isSkipped ? "bg-red-700 text-white" : ""}
								${
									isSelected
										? "!bg-accent text-black font-semibold"
										: "bg-neutral-100 hover:bg-neutral-800 hover:text-white"
								}
							`}
							style={{ scrollSnapAlign: "start" }}
						>
							{i + 1}
						</div>
					);
				})}
			</div>

			{/* Scroll Right */}
			<div
				onClick={scrollRight}
				className="w-10 h-10 px-2 py-1 bg-gray-100 hover:bg-gray-300 rounded flex items-center justify-center cursor-pointer"
			>
				<ChevronRight size={32} />
			</div>

			{/* Grid Dropdown */}
			<div
				ref={dropdownRef}
				onClick={handleDropDown}
				className="max-w-fit h-10 px-2 flex items-center justify-center relative hover:bg-neutral-200 rounded-md border border-neutral-800\30"
			>
				<div className="flex gap-2 items-center">
					<span  className="text-base font-medium flex items-center"
  style={{ transform: "scaleY(1.1)", transformOrigin: "center" }}>{total}</span>
					<div className="w-px h-10 bg-neutral-300"></div>
					<LayoutGrid size={18} className="cursor-pointer text-neutral-700 align-middle" />
				</div>

				{open && (
					<div className="absolute top-12 left-0 bg-white shadow-lg border rounded-md p-4 w-[300px] max-h-[300px] overflow-y-auto z-50">
						<h3 className="font-semibold">Question Overview</h3>
						<div className="py-4 text-sm flex justify-between">
							<span>
								Answered:{" "}
								{
									Object.values(selectedOptions).filter((v) => v.length > 0)
										.length
								}
							</span>
							<span>
								Not Answered: {total - Object.keys(selectedOptions).length}
							</span>
						</div>
						<div className="grid grid-cols-5 gap-2">
							{Array.from({ length: total }).map((_, i) => {
								const isSelected = (selectedOptions[i] ?? []).length > 0;
								const isSkipped = skippedQuestions.has(i);

								return (
									<div
										key={i}
										onClick={() => {
											setActive(i);
											setOpen(false);
										}}
										className={`h-10 w-10 flex flex-col items-center justify-center rounded-md border cursor-pointer text-xs
											${active === i ? "!bg-black !text-white" : ""}
											${isSkipped ? "bg-red-700 text-white" : ""}
											${
												isSelected
													? "!bg-accent text-black font-semibold"
													: "hover:bg-black hover:text-white"
											}
										`}
									>
										<span>{i + 1}</span>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Slider;
