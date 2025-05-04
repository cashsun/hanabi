import {getConfig, getModel, loadConfigToEnv} from '@/lib/config';
import { getSystemMessages } from '@/lib/systemPrompts';
import { getMcpTools } from '@/lib/useMcpTools';
import {streamText} from 'ai';
import {NextApiResponse} from 'next';
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request, res: NextApiResponse) {
	loadConfigToEnv();
	const config = getConfig();
	const systemMessages = getSystemMessages();
	console.log('using mcpKeys :>> ', config.serve?.mcpKeys);
	const tools = await getMcpTools(config.serve?.mcpKeys);

	const {messages} = await req.json();
	const model = getModel(config.defaultModel);
	if (!model) {
		return res.status(500).json({message: 'Missing default model config.'});
	}
	
	const result = streamText({
		model,
		tools,
		maxSteps: config.maxSteps ?? 90,
		messages: [...systemMessages, ...messages],
	});

	return result.toDataStreamResponse();
}
