import {getConfig, getModel, loadConfigToEnv} from '@/lib/config';
import {getSystemMessages} from '@/lib/systemPrompts';
import {getMcpTools} from '@/lib/useMcpTools';
import {jsonSchema, streamText, tool, ToolChoice} from 'ai';
// Allow streaming responses up to 120 seconds
export const maxDuration = 120;

export async function POST(req: Request) {
	loadConfigToEnv();
	const config = getConfig();
	const systemMessages = getSystemMessages();
	console.log('using mcps: >>', config.serve?.mcpKeys);
	let tools = await getMcpTools(config.serve?.mcpKeys);
	let toolChoice: ToolChoice<any> = 'auto';

	const {messages, withAnswerSchema} = await req.json();
	if (config.answerSchema && withAnswerSchema) {
		toolChoice = 'required';
		tools = {
			...tools,
			'format-answer': tool({
				description: 'A tool for providing the final answer.',
				parameters: jsonSchema(config.answerSchema),
			}),
		};
	}
	const model = getModel(config.defaultModel);
	if (!model) {
		return new Response(`No default model found.`, {
			status: 400,
		});
	}

	const result = streamText({
		model,
		tools,
		toolChoice,
		maxSteps: config.maxSteps ?? 10,
		messages: [...systemMessages, ...messages],
	});

	return result.toDataStreamResponse();
}
