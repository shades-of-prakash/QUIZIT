import { file } from "bun";

export function staticAssetController(req: Request) {
	const url = new URL(req.url);

	const assetPath = url.pathname.startsWith("/")
		? url.pathname.slice(1)
		: url.pathname;

	try {
		const asset = file(`./dist/${assetPath}`);

		if (!asset.size) {
			return new Response("Not Found", { status: 404 });
		}

		return new Response(asset, {
			headers: {
				"Content-Type": asset.type || "application/octet-stream",
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	} catch {
		return new Response("Not Found", { status: 404 });
	}
}
