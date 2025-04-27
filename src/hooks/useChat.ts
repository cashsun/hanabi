import { useQuery } from '@tanstack/react-query';
import { CoreMessage, generateText, LanguageModelV1 } from 'ai';
import { getMcpTools } from './useMcpTools.js';
import { getConfig } from '../components/config/util.js';

const maxSteps = getConfig().maxSteps ?? 1;

export const useChat = (
	model: LanguageModelV1 | undefined,
	messages: CoreMessage[],
	mcpKeys: string[],
) => {
	return useQuery({
		queryKey: ['use-chat', model, messages, mcpKeys],
		enabled: !!model && !!messages.length,
		queryFn: async () => {
			if (messages.at(-1)?.role === 'assistant') {
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
