import {NO_CLASSIFICATION} from '@/lib/constants';
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
async function fetchAgentAnswer(
	apiUrl: string | undefined,
	messages: UIMessage[] | string,
): Promise<string> {
	if (!apiUrl) {
		return '';
	}
	const result = await fetch(join(apiUrl, '/generate'), {
		method: 'POST',
		body: JSON.stringify(
			typeof messages === 'string' ? {prompt: messages} : {messages},
		),
	}).then(res => res.json());

	if (result.answer && typeof result.answer === 'string') {
		return result.answer;
	}
	return `\`\`\`json\n${JSON.stringify(result)}\n\`\`\``;
}
async function getMultiAgentsStream(
	model: LanguageModelV1,
	config: HanabiConfig,
	bodyJson: {messages: UIMessage[]; withAnswerSchema?: boolean},
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
				messages: bodyJson.messages,
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
				body: JSON.stringify(bodyJson),
			});
		}
		case 'workflow': {
			const agents = multiAgents.agents;
			if (!agents.length) {
				return new Response(`missing work agents config`, {status: 500});
			}
			// always start with last message
			let stepInput: UIMessage[] | string = bodyJson.messages.slice(-1);
			let step = 1;
			for (const agent of agents) {
				console.log(`⟡ Step ${step}: ${agent.name}`);
				if (step !== agents.length) {
					const answer = await fetchAgentAnswer(agent.apiUrl, stepInput);
					console.log(`⟡ output: ${answer}`);
					step++;
					stepInput = answer;
				}
			}
			// stream last step
			return await fetch(join(agents[step - 1].apiUrl, `/chat`), {
				method: 'POST',
				body: JSON.stringify({
					messages:
						typeof stepInput === 'string'
							? [{role: 'user', content: stepInput} as UIMessage]
							: stepInput,
					withAnswerSchema: bodyJson.withAnswerSchema,
				}),
			});
		}
		default:
			return new Response(`multiAgents strategy type not valid.`, {
				status: 500,
			});
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
		if (response !== NO_CLASSIFICATION) {
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
