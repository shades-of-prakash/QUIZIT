import { Outlet } from "react-router";
import { CircleQuestionMark, Icon, Trophy } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
function DashboardLayout() {
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
	const handleActive = (index: number) => {
		setCurrentActive(index);
	};

	return (
		<div className=" w-screen h-dvh  flex flex-col">
			<div className="w-full h-16 bg-white  border-b border-neutral-800/30 flex items-center px-4">
				<h1 className="text-2xl font-bold">
					QUIZ<span className="text-accent">IT</span>
				</h1>
			</div>
			<div className="w-full flex flex-1 ">
				<div className="bg-neutral-100 w-1/5 h-full flex flex-col gap-1 py-1 border-r border-neutral-400">
					{menuItems.map((item, index) => {
						return (
							<div
								key={index + 1}
								className="px-2"
								onClick={() => handleActive(index)}
							>
								<Link
									to={item.link}
									className={`flex items-center ${
										currentActive === index
											? "bg-black text-white border border-neutral-400"
											: "bg-neutral-100 cursor-pointer hover:bg-accent hover:border-neutral-300"
									} rounded-md py-2 px-2 gap-2`}
								>
									{item.icon}
									<span>{item.name}</span>
								</Link>
							</div>
						);
					})}
				</div>
				<div className=" bg-violet-500 w-full h-full">
					<Outlet />
				</div>
			</div>
		</div>
	);
}

export default DashboardLayout;
