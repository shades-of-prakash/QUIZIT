import React, { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SliderProps {
	total: number;
	active: number;
	setActive: (index: number) => void;
	selectedOptions: { [key: number]: string[] };
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

	const scrollLeft = () => {
		containerRef.current?.scrollBy({ left: -40, behavior: "smooth" });
	};

	const scrollRight = () => {
		containerRef.current?.scrollBy({ left: 40, behavior: "smooth" });
	};

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
		<div className="flex items-center gap-2">
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
					const isSelected = selectedOptions.hasOwnProperty(i);
					const isSkipped = skippedQuestions.has(i);
					return (
						<div
							key={i}
							ref={(el) => {
								itemRefs.current[i] = el;
							}}
							onClick={() => setActive(i)}
							className={`border select-none border-neutral-300 rounded-md w-10 h-10 flex items-center justify-center flex-shrink-0 cursor-pointer
                ${
									active === i
										? "!bg-black !text-white"
										: isSkipped
										? "bg-red-900 text-white"
										: "bg-neutral-100 hover:bg-neutral-200 hover:text-black"
								}
                ${isSelected ? "!bg-accent text-black font-semibold" : ""}
              `}
							style={{ scrollSnapAlign: "start" }}
						>
							{i + 1}
						</div>
					);
				})}
			</div>

			<div
				onClick={scrollRight}
				className="w-10 h-10 px-2 py-1 bg-gray-100 hover:bg-gray-300 rounded flex items-center justify-center cursor-pointer"
			>
				<ChevronRight size={32} />
			</div>
		</div>
	);
};

export default Slider;
