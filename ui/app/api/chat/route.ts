import {getConfig, getModel, loadConfigToEnv} from '@/lib/config';
import {getSystemMessages} from '@/lib/systemPrompts';
import {getMcpTools} from '@/lib/useMcpTools';
import {generateText, streamText} from 'ai';
// Allow streaming responses up to 120 seconds
export const maxDuration = 120;

export async function POST(req: Request) {
	loadConfigToEnv();
	const config = getConfig();
	const systemMessages = getSystemMessages();
	console.log('using mcps: >>', config.serve?.mcpKeys);
	const tools = await getMcpTools(config.serve?.mcpKeys);

	const {messages, blocking} = await req.json();
	const model = getModel(config.defaultModel);
	if (!model) {
		return new Response(`No default model found.`, {
			status: 400,
		});
	}
	if (blocking) {
		const result = await generateText({
			model,
			tools,
			maxSteps: config.maxSteps ?? 90,
			messages: [...systemMessages, ...messages],
		});
		Response.json(result);
	} else {
		const result = streamText({
			model,
			tools,
			maxSteps: config.maxSteps ?? 90,
			messages: [...systemMessages, ...messages],
		});

		return result.toDataStreamResponse();
	}
}
