import React, { useState, useEffect } from "react";
import { Loader2, Pause, Play, XOctagon, Check } from "lucide-react";
import { toast } from "sonner";
import Box from "../assets/box.webp";

interface RequestItem {
	_id: string;
	participant1Name: string;
	participant1RollNo: string;
	collegeName: string;
	quizId: string;
	status: "PENDING" | "APPROVED" | "PAUSED" | "REJECTED" | "COMPLETED";
	requestedAt: string;
}

const AdminLiveDashboard = () => {
	const [requests, setRequests] = useState<RequestItem[]>([]);
	const [loading, setLoading] = useState(true);

	const [revokeModalOpen, setRevokeModalOpen] = useState(false);
	const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
	const [revokePin, setRevokePin] = useState("");

	const fetchRequests = async () => {
		try {
			const res = await fetch("/api/approval/list");
			if (res.ok) {
				const data = await res.json();
				setRequests(data.requests);
			}
		} catch (err) {
			console.error("Failed to fetch requests", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRequests();
		const interval = setInterval(fetchRequests, 3000);
		return () => clearInterval(interval);
	}, []);

	const handleApprove = async (req: RequestItem) => {
		try {
			const res = await fetch("/api/approval/approve", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ _id: req._id, quizId: req.quizId, participant1RollNo: req.participant1RollNo }),
			});
			const data = await res.json();
			if (res.ok) {
				toast.success(`Approved ${req.participant1Name}`);
				fetchRequests();
			} else {
				toast.error(data.message || "Failed to approve");
			}
		} catch (err) {
			toast.error("Network error");
		}
	};

	const handleUpdateStatus = async (_id: string, status: string) => {
		if (status === "REVOKED") {
			setRevokeTargetId(_id);
			setRevokePin("");
			setRevokeModalOpen(true);
			return;
		}

		try {
			const res = await fetch("/api/approval/update", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ _id, status }),
			});
			if (res.ok) {
				toast.success(`Session ${status.toLowerCase()}`);
				fetchRequests();
			} else {
				const data = await res.json();
				toast.error(data.message || "Failed to update status");
			}
		} catch (err) {
			toast.error("Network error");
		}
	};

	const handleConfirmRevoke = async () => {
		if (!revokeTargetId || !revokePin) {
			toast.error("PIN is required");
			return;
		}

		try {
			const res = await fetch("/api/approval/update", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ _id: revokeTargetId, status: "REVOKED", pin: revokePin }),
			});
			if (res.ok) {
				toast.success(`Session revoked`);
				fetchRequests();
				setRevokeModalOpen(false);
				setRevokeTargetId(null);
				setRevokePin("");
			} else {
				const data = await res.json();
				toast.error(data.message || "Failed to revoke session");
			}
		} catch (err) {
			toast.error("Network error");
		}
	};

	const displayRequests = requests.filter(r => r.status !== "REJECTED" && r.status !== "COMPLETED"); // Hide rejected and completed from the main table, keep pending/approved/paused

	return (
		<div className="w-full h-full flex flex-col bg-white">
			{/* Header matching Createquiz.tsx */}
			<header className="flex items-center justify-between h-14 bg-white border-b border-neutral-100 px-4">
				<div className="flex flex-col">
					<h1 className="text-xl font-bold">Live Dashboard</h1>
					<p className="text-sm text-gray-600">
						Manage exam logins and active sessions
					</p>
				</div>
				<div className="flex gap-4">
					<div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
						<span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
						Waiting Room: {requests.filter(r => r.status === "PENDING").length}
					</div>
					<div className="flex items-center gap-2 text-sm text-gray-600 font-medium border-l border-gray-300 pl-4">
						<span className="w-2 h-2 rounded-full bg-green-500"></span>
						Active Sessions: {requests.filter(r => r.status === "APPROVED" || r.status === "PAUSED").length}
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="flex-1 bg-white p-4 overflow-x-auto">
				{loading && displayRequests.length === 0 ? (
					<div className="w-full h-full flex flex-col items-center justify-center py-16">
						<div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
						<p className="text-gray-600">Loading sessions...</p>
					</div>
				) : displayRequests.length === 0 ? (
					<div className="flex border border-neutral-400 rounded-md flex-col items-center justify-center py-16 text-gray-500">
						<img
							src={Box}
							alt="No sessions"
							width={64}
							height={64}
							className="w-16 h-16 mb-4 object-contain"
							loading="lazy"
						/>
						<p>No active sessions or waiting students</p>
					</div>
				) : (
					<div className="overflow-hidden rounded-md border border-gray-300 shadow-sm">
						<table className="w-full text-sm">
							<thead className="bg-black/90 text-gray-300">
								<tr>
									<th className="px-4 py-2 text-left">#</th>
									<th className="px-4 py-2 text-left">Student Name</th>
									<th className="px-4 py-2 text-left">Roll No</th>
									<th className="px-4 py-2 text-left">College</th>
									<th className="px-4 py-2 text-center">Status</th>
									<th className="px-4 py-2 text-center">Actions</th>
								</tr>
							</thead>
							<tbody>
								{displayRequests.map((req, index) => (
									<tr
										key={req._id}
										className="border-t border-gray-200 hover:bg-gray-50 transition"
									>
										<td className="px-4 py-2">{index + 1}</td>
										<td className="px-4 py-2 font-medium">{req.participant1Name}</td>
										<td className="px-4 py-2 font-mono text-gray-600">{req.participant1RollNo}</td>
										<td className="px-4 py-2 text-gray-600">{req.collegeName || "N/A"}</td>
										<td className="px-4 py-2 text-center">
											{req.status === "PENDING" && (
												<span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 animate-pulse border border-yellow-200">
													Waiting
												</span>
											)}
											{req.status === "APPROVED" && (
												<span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
													Active
												</span>
											)}
											{req.status === "PAUSED" && (
												<span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
													Paused
												</span>
											)}
										</td>
										<td className="px-4 py-2 flex gap-2 justify-center items-center">
											{req.status === "PENDING" && (
												<>
													<button
														onClick={() => handleApprove(req)}
														className="flex gap-1 items-center bg-black hover:bg-gray-800 text-white px-3 py-1 rounded-md transition text-xs"
													>
														<Check size={14} /> Approve
													</button>
													<button
														onClick={() => handleUpdateStatus(req._id, "REJECTED")}
														className="flex gap-1 items-center border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 rounded-md transition text-xs"
													>
														<XOctagon size={14} /> Decline
													</button>
												</>
											)}
											
											{req.status === "APPROVED" && (
												<button
													onClick={() => handleUpdateStatus(req._id, "PAUSED")}
													className="flex gap-1 items-center border border-orange-400 text-orange-600 hover:bg-orange-50 px-3 py-1 rounded-md transition text-xs"
													title="Pause Session"
												>
													<Pause size={14} /> Pause
												</button>
											)}
											
											{req.status === "PAUSED" && (
												<button
													onClick={() => handleUpdateStatus(req._id, "APPROVED")}
													className="flex gap-1 items-center border border-green-600 text-green-700 hover:bg-green-50 px-3 py-1 rounded-md transition text-xs"
													title="Resume Session"
												>
													<Play size={14} /> Resume
												</button>
											)}

											{(req.status === "APPROVED" || req.status === "PAUSED") && (
												<button
													onClick={() => handleUpdateStatus(req._id, "REVOKED")}
													className="flex gap-1 items-center bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded-md transition text-xs"
													title="Revoke Session"
												>
													<XOctagon size={14} /> Revoke
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</main>

			{/* Revoke Confirmation Modal */}
			{revokeModalOpen && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full border border-gray-200">
						<h2 className="text-lg font-bold text-gray-900 mb-2">Confirm Revoke</h2>
						<p className="text-gray-600 mb-6 text-sm">
							Enter the Admin PIN to confirm revoking this session. This will forcefully submit their answers and end their exam.
						</p>
						<input
							type="password"
							value={revokePin}
							onChange={(e) => setRevokePin(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleConfirmRevoke();
								}
							}}
							className="w-full px-3 py-2 border border-gray-300 rounded-md mb-6 outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
							placeholder="Enter PIN"
							autoFocus
						/>
						<div className="flex justify-end gap-3">
							<button
								onClick={() => {
									setRevokeModalOpen(false);
									setRevokePin("");
									setRevokeTargetId(null);
								}}
								className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmRevoke}
								className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-colors"
							>
								Revoke Session
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminLiveDashboard;
