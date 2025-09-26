import { Link } from "react-router";
import png404 from "../assets/404.png";
import { ArrowRight } from "lucide-react";
const Page404 = () => {
	return (
		<div className="flex flex-col items-center justify-center h-screen text-center">
			<img src={png404} alt="404-PAGE" className="w-[300px]" />
			<h1 className="text-4xl font-semibold mb-4">
				Error 404 : Page not found
			</h1>
			<p className="text-lg mb-2">
				We looked everywhere but couldn't find the page you were looking for.
			</p>
			<Link
				to="/"
				className="flex gap-1 items-center underline underline-offset-1"
			>
				Go back home <ArrowRight size={12} />
			</Link>
		</div>
	);
};

export default Page404;
