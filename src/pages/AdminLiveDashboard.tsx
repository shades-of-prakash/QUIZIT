import React, { useState, useEffect } from "react";
import { Loader2, Pause, Play, XOctagon, Check, Inbox } from "lucide-react";
import { toast } from "sonner";

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

	const displayRequests = requests
		.filter(r => r.status !== "REJECTED" && r.status !== "COMPLETED") // Hide rejected and completed from the main table, keep pending/approved/paused
		.sort((a, b) => {
			// Put PENDING at the top
			if (a.status === "PENDING" && b.status !== "PENDING") return -1;
			if (a.status !== "PENDING" && b.status === "PENDING") return 1;
			
			// If both have the same status, sort by requestedAt (newest first)
			if (a.requestedAt && b.requestedAt) {
				return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
			}
			return 0;
		});

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isProcessingBatch, setIsProcessingBatch] = useState(false);

	const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.checked) {
			setSelectedIds(new Set(displayRequests.map(r => r._id)));
		} else {
			setSelectedIds(new Set());
		}
	};

	const handleSelectRow = (id: string) => {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		setSelectedIds(newSet);
	};

	const handleBatchApprove = async () => {
		const pendingSelected = displayRequests.filter(r => selectedIds.has(r._id) && r.status === "PENDING");
		if (pendingSelected.length === 0) {
			toast.info("No pending requests selected to approve.");
			return;
		}
		
		setIsProcessingBatch(true);
		let successCount = 0;
		for (const req of pendingSelected) {
			try {
				const res = await fetch("/api/approval/approve", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ _id: req._id, quizId: req.quizId, participant1RollNo: req.participant1RollNo }),
				});
				if (res.ok) successCount++;
			} catch (err) {
				console.error(err);
			}
		}
		toast.success(`Approved ${successCount} requests`);
		setSelectedIds(new Set());
		fetchRequests();
		setIsProcessingBatch(false);
	};

	const handleBatchDecline = async () => {
		const pendingSelected = displayRequests.filter(r => selectedIds.has(r._id) && r.status === "PENDING");
		if (pendingSelected.length === 0) {
			toast.info("No pending requests selected to decline.");
			return;
		}
		
		setIsProcessingBatch(true);
		let successCount = 0;
		for (const req of pendingSelected) {
			try {
				const res = await fetch("/api/approval/update", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ _id: req._id, status: "REJECTED" }),
				});
				if (res.ok) successCount++;
			} catch (err) {
				console.error(err);
			}
		}
		toast.success(`Declined ${successCount} requests`);
		setSelectedIds(new Set());
		fetchRequests();
		setIsProcessingBatch(false);
	};

	return (
		<div className="w-full h-full flex flex-col bg-zinc-50 font-sans text-zinc-950">
			{/* Header matching Createquiz.tsx */}
			<header className="flex items-center justify-between h-16 bg-white border-b border-zinc-300 px-6 shrink-0">
				<div className="flex flex-col gap-0.5">
					<h1 className="text-xl font-bold tracking-tight">Requests</h1>
					<p className="text-sm text-zinc-500">
						Manage exam logins and active sessions
					</p>
				</div>
				<div className="flex gap-4">
					<div className="flex items-center gap-2 text-sm text-zinc-600 font-medium">
						<span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
						Waiting Room: {requests.filter(r => r.status === "PENDING").length}
					</div>
					<div className="flex items-center gap-2 text-sm text-zinc-600 font-medium border-l border-zinc-300 pl-4">
						<span className="w-2 h-2 rounded-full bg-green-500"></span>
						Active Sessions: {requests.filter(r => r.status === "APPROVED" || r.status === "PAUSED").length}
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="flex-1 bg-zinc-100/50 p-2 md:p-4 overflow-hidden flex flex-col">
				{loading && displayRequests.length === 0 ? (
					<div className="w-full h-full flex flex-col items-center justify-center py-20">
						<Loader2 className="w-8 h-8 animate-spin text-zinc-400 mb-4" />
						<p className="text-sm text-zinc-500">Loading sessions...</p>
					</div>
				) : displayRequests.length === 0 ? (
					<div className="flex-1 w-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-white border border-zinc-200 border-dashed rounded-xl shadow-sm">
						<div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
							<Inbox className="w-6 h-6 text-zinc-400" />
						</div>
						<h3 className="text-sm font-semibold text-zinc-900 mb-1">No active sessions or waiting students</h3>
						<p className="text-sm text-zinc-500 text-center max-w-sm">
							When students try to join a quiz, their requests will appear here.
						</p>
					</div>
				) : (
					<div className="flex-1 flex flex-col min-h-0">
						{selectedIds.size > 0 && (
							<div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex items-center justify-between shrink-0">
								<span className="text-sm text-blue-800 font-medium">{selectedIds.size} request(s) selected</span>
								<div className="flex gap-2">
									<button onClick={handleBatchApprove} disabled={isProcessingBatch} className="bg-black text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-opacity">
										{isProcessingBatch ? "Processing..." : "Approve Selected"}
									</button>
									<button onClick={handleBatchDecline} disabled={isProcessingBatch} className="border border-red-300 text-red-600 bg-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-opacity">
										Decline Selected
									</button>
								</div>
							</div>
						)}
						<div className="overflow-y-auto flex-1 rounded-md border border-zinc-200 shadow-sm bg-white">
							<table className="w-full text-sm">
								<thead className="bg-black/90 text-gray-300 sticky top-0 z-10">
									<tr>
										<th className="px-4 py-2 w-12 text-center">
											<input 
												type="checkbox" 
												onChange={handleSelectAll} 
												checked={displayRequests.length > 0 && selectedIds.size === displayRequests.length} 
												className="w-4 h-4 accent-black rounded cursor-pointer" 
											/>
										</th>
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
										<td className="px-4 py-2 text-center">
											<input 
												type="checkbox" 
												checked={selectedIds.has(req._id)} 
												onChange={() => handleSelectRow(req._id)} 
												className="w-4 h-4 accent-black rounded cursor-pointer" 
											/>
										</td>
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
