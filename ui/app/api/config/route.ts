import { getConfig } from '@/lib/config';

export async function GET() {
	const config = getConfig();
	return Response.json({
		defaultModel: config.defaultModel,
		serve: config.serve
	});
}
