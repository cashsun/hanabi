import {getConfig} from '@/lib/config';
import {NextApiResponse} from 'next';

export async function GET(req: Request) {
	const config = getConfig();
	return Response.json({defaultModel: config.defaultModel});
}
