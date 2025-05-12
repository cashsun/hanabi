import {useQuery} from '@tanstack/react-query';
import {type CoreMessage, type LanguageModelV1, generateObject} from 'ai';
import Chalk from 'chalk';
import {join} from 'path';
import {useState} from 'react';
import {NO_CLASSIFICATION} from '../constants.js';
import {getConfig} from '../components/config/util.js';

async function fetchAgentAnswer(
	apiUrl: string | undefined,
	messages: CoreMessage[] | string,
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

export function useMultiAgentsChat({
	model,
	messages,
}: {
	model: LanguageModelV1 | undefined;
	messages: CoreMessage[];
}) {
	const multiAgents = getConfig().multiAgents;
	const [isStreaming, setIsStreaming] = useState(false);
	const [agentMessages, setAgentMessages] = useState<CoreMessage[]>([]);
	const {data, isFetching, ...rest} = useQuery({
		queryKey: ['use-mutli-agents-chat', model, messages],
		async queryFn() {
			if (messages.at(-1)?.role !== 'user' || !model || isStreaming) {
				return [];
			}

			console.log(
				Chalk.magenta(
					`\n⟡ multi-agent strategy: ${multiAgents?.strategy ?? 'NOT FOUND'}`,
				),
			);
			setIsStreaming(true);
			switch (multiAgents?.strategy) {
				case 'routing': {
					const agents = multiAgents.agents;
					const agentsByTopic = agents.reduce<
						Record<
							string,
							{apiUrl: string; classification: string; name: string}
						>
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
						messages,
					});
					if (classification === NO_CLASSIFICATION) {
						console.log(Chalk.gray(NO_CLASSIFICATION));
						setAgentMessages([{role: 'assistant', content: NO_CLASSIFICATION}]);
						break;
					}
					console.log(Chalk.gray(`⟡ classification: ${classification}`));
					const targetAgent = agentsByTopic[classification];
					console.log(Chalk.magenta(`⟡ worker agent: ${targetAgent?.name}`));
					const answer = await fetchAgentAnswer(targetAgent?.apiUrl, messages);
					setAgentMessages([{role: 'assistant', content: answer}]);
					break;
				}
				case 'workflow': {
					const agents = multiAgents.agents;
					if (!agents.length) {
						console.log(Chalk.gray(`⟡ missing worker agents config`));
						break;
					}
					// we start with last message as input
					let stepInput: CoreMessage[] | string = messages.slice(-1);
					let step = 1;
					for (const agent of agents) {
						console.log(Chalk.magenta(`⟡ Step ${step}: ${agent.name}`));
						const answer = await fetchAgentAnswer(agent.apiUrl, stepInput);
						console.log(Chalk.gray(`⟡ output: ${answer}`));
						step++;
						stepInput = answer;
					}
					setAgentMessages([
						{role: 'assistant', content: stepInput as unknown as string},
					]);
					break;
				}
				default:
					break;
			}
			setIsStreaming(false);
			return [];
		},
	});

	return {
		data: agentMessages,
		isFetching: isFetching || isStreaming,
		// streaming mode is not supported.
		isStreaming: false,
		...rest,
	};
}
