import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	distDir: '../dist/.next',
	async headers() {
		return [
		  {
			source: "/api/:path*",
			headers: [
			  {
				key: "Access-Control-Allow-Origin",
				value: process.env.ALLOWED_ORIGIN || "*",
			  },
			  {
				key: "Access-Control-Allow-Headers",
				value: "*",
			  },
			  {
				key: "Access-Control-Allow-Methods",
				value: "GET,POST",
			  },
			],
		  },
		];
	  },
};

export default nextConfig;
