import { getConfig, getModel, loadConfigToEnv } from '@/lib/config';
import { getSystemMessages } from '@/lib/systemPrompts';
import { getMcpTools } from '@/lib/useMcpTools';
import { generateText, jsonSchema, tool, ToolChoice } from 'ai';
// Allow responses up to 120 seconds
export const maxDuration = 120;

export async function POST(req: Request) {
	loadConfigToEnv();
	const config = getConfig();
	const systemMessages = getSystemMessages();
	console.log('using mcps: >>', config.serve?.mcpKeys);
	let tools = await getMcpTools(config.serve?.mcpKeys);
	let toolChoice: ToolChoice<any> = 'auto';

	if (config.answerSchema) {
		toolChoice = 'required';
		tools = {
			...tools,
			'format-answer': tool({
				description: 'A tool for providing the final answer.',
				parameters: jsonSchema(config.answerSchema),
			}),
		};
	}

	const {prompt, messages} = await req.json();
	const model = getModel(config.defaultModel);
	if (!model) {
		return new Response(`No default model found.`, {
			status: 400,
		});
	}

	const {text, response} = await generateText({
		model,
		tools,
		toolChoice,
		maxSteps: config.maxSteps ?? 10,
		messages:[...systemMessages, ...(messages ?? [{role: 'user', content: prompt}])],
	});

	if (config.answerSchema) {
		const lastMessage = response.messages.at(-1);
		const lastPart = lastMessage?.content.at(-1);
		if (
			lastMessage?.role === 'assistant' &&
			typeof lastPart !== 'string' &&
			lastPart?.type === 'tool-call'
		) {
			return Response.json(lastPart.args);
		}
	}

	return Response.json({answer: text});
}
