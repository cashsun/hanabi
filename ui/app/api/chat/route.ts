import { NO_CLASSIFICATION } from '../../../../types/constants';
import {getConfig, getModel, loadConfigToEnv} from '@/lib/config';
import {getSystemMessages} from '@/lib/systemPrompts';
import {getMcpTools} from '@/lib/useMcpTools';
import {
	generateObject,
	jsonSchema,
	LanguageModelV1,
	streamText,
	tool,
	ToolChoice,
	UIMessage,
} from 'ai';
import {join} from 'path';
// Allow streaming responses up to 120 seconds
export const maxDuration = 120;

async function getMultiAgentsStream(
	model: LanguageModelV1,
	config: HanabiConfig,
	body: {messages: UIMessage[]; withAnswerSchema?: boolean},
) {
	const multiAgents = config.multiAgents;
	switch (multiAgents?.strategy) {
		case 'routing': {
			const agents = multiAgents.agents;
			const agentsByTopic = agents.reduce<
				Record<string, {apiUrl: string; classification: string; name: string}>
			>((memo, agent) => {
				memo[agent.classification] = agent;
				return memo;
			}, {});
			const topics = Object.keys(agentsByTopic);
			if (!multiAgents.force) {
				topics.push(NO_CLASSIFICATION);
			}
			const {object: classification} = await generateObject({
				model,
				output: 'enum',
				enum: topics,
				messages: body.messages,
			});
			if (classification === NO_CLASSIFICATION) {
				console.log(NO_CLASSIFICATION);
			
				return NO_CLASSIFICATION;
			}
			console.log(`⟡ classification: ${classification}`);
			const targetAgent = agentsByTopic[classification];
			console.log(`⟡ worker agent: ${targetAgent?.name}`);
			return await fetch(join(targetAgent.apiUrl, `/chat`), {
				method: 'POST',
				body: JSON.stringify(body),
			});
		}
		default:
			return new Response(
				`agentsStrategy type: ${multiAgents?.strategy} not valid.`,
				{status: 500},
			);
	}
}

export async function POST(req: Request) {
	loadConfigToEnv();
	const config = getConfig();
	const systemMessages = getSystemMessages();
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
			status: 500,
		});
	}
	// enforce multi-agents mode if found in config
	if (config.multiAgents) {
		const response = await getMultiAgentsStream(model, config, {
			messages,
			withAnswerSchema,
		});
		if(response !== NO_CLASSIFICATION){
			return response;
		}
	}

	// single agent mode
	const result = streamText({
		model,
		tools,
		toolChoice,
		maxSteps: config.maxSteps ?? 10,
		messages: [...systemMessages, ...messages],
	});
	return result.toDataStreamResponse();
}
