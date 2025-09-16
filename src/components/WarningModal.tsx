import React from "react";
import { TriangleAlert } from "lucide-react";

interface WarningModalProps {
	open: boolean;
	message: string;
	onClose: () => void;
}

const WarningModal: React.FC<WarningModalProps> = ({
	open,
	message,
	onClose,
}) => {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
			<div className="bg-white rounded-xl shadow-xl w-[380px] p-6 text-center animate-fadeIn">
				<div className="flex flex-col items-center justify-center gap-2 mb-4">
					<TriangleAlert size={48} />
					<h2 className="text-2xl font-semibold text-amber-700">Warning</h2>
				</div>
				<p className="flex flex-col gap-1 mb-6 text-sm text-gray-700 leading-relaxed p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
					<span>
						You have switched tabs
						<span className="font-semibold mx-1">{message} out of 3</span>{" "}
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

export default WarningModal;
