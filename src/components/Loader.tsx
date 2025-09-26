import React from "react";

import logo200 from "../assets/logo_bpk6ma_c_scale,w_200.webp";
import logo419 from "../assets/logo_bpk6ma_c_scale,w_419.webp";

const Loader: React.FC = () => {
	return (
		<div className="flex flex-col items-center justify-center h-screen bg-white">
			<img
				srcSet={`
					${logo200} 1x,
					${logo419} 2x
				`}
				src={logo200}
				fetchPriority="high"
				alt="logo"
				className="mb-8 w-24 h-24"
			/>

			<div className="flex space-x-2">
				<span className="w-3 h-3 bg-black rounded-full animate-bounce"></span>
				<span className="w-3 h-3 bg-black rounded-full animate-bounce [animation-delay:-0.2s]"></span>
				<span className="w-3 h-3 bg-black rounded-full animate-bounce [animation-delay:-0.4s]"></span>
			</div>
		</div>
	);
};

export default Loader;
