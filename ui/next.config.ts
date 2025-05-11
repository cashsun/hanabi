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
				value: "*",
			  },
			  {
				key: "Access-Control-Allow-Credentials",
				value: "true",
			  },
			  {
				key: "Access-Control-Allow-Methods",
				value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
			  },
			],
		  },
		];
	  },
};

export default nextConfig;
