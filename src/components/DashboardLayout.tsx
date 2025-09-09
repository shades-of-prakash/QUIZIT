import { Outlet, useLocation } from "react-router";
import { CircleQuestionMark, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router";

function DashboardLayout() {
	const location = useLocation();
	const [currentActive, setCurrentActive] = useState(0);

	const menuItems = [
		{
			name: "Quiz",
			link: "/admin/createquiz",
			icon: <CircleQuestionMark size={20} />,
		},
		{
			name: "Results",
			link: "/admin/results",
			icon: <Trophy size={20} />,
		},
	];

	useEffect(() => {
		const index = menuItems.findIndex((item) =>
			location.pathname.startsWith(item.link)
		);
		if (index !== -1) setCurrentActive(index);
	}, [location.pathname]);

	return (
		<div className="w-screen h-dvh flex flex-col">
			<div className="w-full h-16 bg-white border-b border-neutral-800/30 flex items-center px-4">
				<h1 className="text-2xl font-bold">
					QUIZ<span className="text-accent">IT</span>
				</h1>
			</div>
			<div className="w-full flex flex-1">
				<div className="bg-neutral-100 w-[200px] h-full flex flex-col gap-1 py-1 border-r border-neutral-400">
					{menuItems.map((item, index) => (
						<div key={index} className="px-2">
							<Link
								to={item.link}
								className={`flex items-center  ${
									currentActive === index
										? "bg-black text-white border border-neutral-400"
										: "bg-neutral-100 cursor-pointer hover:bg-accent hover:border-neutral-300"
								} rounded-md py-2 px-2 gap-2`}
							>
								{item.icon}
								<span>{item.name}</span>
							</Link>
						</div>
					))}
				</div>
				<div className="bg-white w-full h-full">
					<Outlet />
				</div>
			</div>
		</div>
	);
}

export default DashboardLayout;
