import {useQuery} from '@tanstack/react-query';
import type {CoreMessage, LanguageModelV1} from 'ai';
import {generateText, streamText} from 'ai';
import {useState} from 'react';
import {getConfig} from '../components/config/util.js';
import {getMcpTools} from './useMcpTools.js';

export const useChat = (
	model: LanguageModelV1 | undefined,
	messages: CoreMessage[],
	mcpKeys: string[],
	streaming?: boolean,
) => {
	const [chunks, setChunks] = useState('');
	const [isStreaming, setIsStreaming] = useState(false);
	const [agentMessages, setAgentMessages] = useState<CoreMessage[]>([]);
	const {isFetching, data, ...rest} = useQuery({
		queryKey: ['use-chat', model, messages, mcpKeys],
		async queryFn() {
			const maxSteps = getConfig().maxSteps ?? 90;
			if (messages.at(-1)?.role !== 'user') {
				return [];
			}

			if (streaming) {
				setChunks('');
				setIsStreaming(false);

				const tools = await getMcpTools(mcpKeys);
				setIsStreaming(true);
				const {textStream, response} = streamText({
					model: model!,
					messages,
					tools,
					maxSteps,
				});
				const reader = textStream.getReader();
				reader.read().then(async function processText({done, value}) {
					if (done) {
						setChunks('');
						setIsStreaming(false);
						return;
					}
					setChunks(prev => `${prev}${value}`);
					reader.read().then(processText);
				});
				const res = await response;
				setAgentMessages(prev => [...prev, ...res.messages]);
				return res.messages;
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
	return {
		data: streaming ? agentMessages : data,
		chunks,
		isFetching: isStreaming || isFetching,
		...rest,
	};
};
