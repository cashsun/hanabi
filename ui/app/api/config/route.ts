'use server';
import {getConfig} from '@/lib/config';

export async function GET() {
	const config = getConfig();
	return Response.json({
		defaultModel: config.defaultModel,
		answerSchema: config.answerSchema,
		...config.serve,
	});
}
