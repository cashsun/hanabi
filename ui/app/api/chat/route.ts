import {NO_CLASSIFICATION} from '@/lib/constants';
import {getConfig, getModel, loadConfigToEnv} from '@/lib/config';
import {getSystemMessages} from '@/lib/systemPrompts';
import {getMcpTools} from '@/lib/useMcpTools';
import urlJoin from 'url-join';
import {
	createDataStreamResponse,
	generateId,
	generateObject,
	jsonSchema,
	LanguageModelV1,
	streamText,
	tool,
	ToolChoice,
	UIMessage,
} from 'ai';
// Allow streaming responses up to 120 seconds
export const maxDuration = 120;
async function fetchAgentAnswer(
	apiUrl: string | undefined,
	messages: UIMessage[] | string,
): Promise<string> {
	if (!apiUrl) {
		return '';
	}
	// note: generate endpoint always uses structured answer schema
	const result = await fetch(urlJoin(apiUrl, '/generate'), {
		method: 'POST',
		body: JSON.stringify(
			typeof messages === 'string' ? {prompt: messages} : {messages},
		),
	})
	.then(res => res.json());

	if (result.answer && typeof result.answer === 'string') {
		return result.answer;
	}
	return JSON.stringify(result);
}

async function getAgentStream(
	apiUrl: string,
	messages: UIMessage[] | string,
	withAnswerSchema: boolean | undefined,
) {
	return fetch(urlJoin(apiUrl, `/chat`), {
		method: 'POST',
		body: JSON.stringify({
			messages:
				typeof messages === 'string'
					? [{role: 'user', content: messages} as UIMessage]
					: messages,
			withAnswerSchema: withAnswerSchema,
		}),
	});
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
			return await getAgentStream(
				targetAgent.apiUrl,
				bodyJson.messages,
				bodyJson.withAnswerSchema,
			);
		}
		case 'workflow': {
			const agents = multiAgents.steps;
			if (!agents.length) {
				return new Response(`missing work agents config`, {status: 500});
			}
			// always start with last message
			let stepInput: UIMessage[] | string = bodyJson.messages.slice(-1);
			let step = 1;
			for (const agent of agents) {
				console.log(`⟡ Step ${step}: ${agent.name}`);
				if (step < agents.length) {
					const answer = await fetchAgentAnswer(agent.apiUrl, stepInput);
					console.log(`⟡ output: ${answer}\n`);
					step++;
					stepInput = answer;
				}
			}
			// stream last step
			return await getAgentStream(
				agents[step - 1].apiUrl,
				stepInput,
				bodyJson.withAnswerSchema,
			);
		}
		case 'parallel': {
			const agents = multiAgents.agents;
			if (!agents.length) {
				console.log(`⟡ missing worker agents config`);
				break;
			}
			// we start with last message as input
			const lastMessage: UIMessage[] = bodyJson.messages.slice(-1);
			const FOLLOW_UP_QUESTION = 'follow-up question on result';
			const {object: classification} = await generateObject({
				model,
				output: 'enum',
				enum: ['task', FOLLOW_UP_QUESTION],
				messages: bodyJson.messages,
			});

			console.log(`⟡ query type: ${classification}`);

			if (classification === FOLLOW_UP_QUESTION) {
				// passthrough the follow-up question to main agent.
				console.log(FOLLOW_UP_QUESTION);

				return NO_CLASSIFICATION;
			}

			// create a custom stream to stream messages from all workers one by one
			return createDataStreamResponse({
				execute: async dataStream => {
					dataStream.write(`f:${JSON.stringify({messageId: generateId()})}\n`);
					const enc = new TextDecoder('utf-8');
					for await (const agent of agents) {
						console.log(`⟡ worker - ${agent.name}: processing...`);
						const reader = (
							await getAgentStream(
								agent.apiUrl,
								lastMessage,
								bodyJson.withAnswerSchema,
							)
						).body?.getReader();
						dataStream.write(`0:"\\n## ⟡ ${agent.name}:\\n"\n`);
						await reader?.read().then(function process({done, value}): any {
							if (!done) {
								const line = enc.decode(value);
								if (value && !line.startsWith('f:') && !line.startsWith('d:')) {
									dataStream.write(line as any);
								}
								return reader.read().then(process);
							}
						});
					}

					dataStream.write(
						`e:${JSON.stringify({finishReason: 'stop', isContinued: false})}\n`,
					);
					dataStream.write(
						`d:${JSON.stringify({finishReason: 'stop', isContinued: false})}\n`,
					);
				},
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
