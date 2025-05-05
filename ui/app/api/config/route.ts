import {getConfig} from '@/lib/config';
import {NextApiResponse} from 'next';

export async function GET() {
	const config = getConfig();
	return Response.json({
		defaultModel: config.defaultModel,
		mcpKeys: config.serve?.mcpKeys ?? [],
	});
}
