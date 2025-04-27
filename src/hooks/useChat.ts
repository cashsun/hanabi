import {useQuery} from '@tanstack/react-query';
import type {CoreMessage, LanguageModelV1} from 'ai';
import {generateText} from 'ai';
import {getConfig} from '../components/config/util.js';
import {getMcpTools} from './useMcpTools.js';

export const useChat = (
	model: LanguageModelV1 | undefined,
	messages: CoreMessage[],
	mcpKeys: string[],
) => {
	return useQuery({
		queryKey: ['use-chat', model, messages, mcpKeys],
		async queryFn() {
			const maxSteps = getConfig().maxSteps ?? 90;
			if (messages.at(-1)?.role !== 'user') {
				return [];
			}

			const tools = await getMcpTools(mcpKeys);
			const {response} = await generateText({
				model: model!,
				messages,
				tools,
				maxSteps,
			});
			return response.messages;
		},
	});
};
