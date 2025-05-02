import {useQuery} from '@tanstack/react-query';
import type {CoreMessage, LanguageModelV1} from 'ai';
import {generateText, streamText} from 'ai';
import {useState} from 'react';
import {getConfig} from '../components/config/util.js';
import {getMcpTools} from './useMcpTools.js';
import {useStdout} from 'ink';
import Chalk from 'chalk';

const clearLines = (n: number) => {
	for (let i = 0; i < n + 3; i++) {
		// first clear the current line, then clear the previous line

		// Clear the current lineodes.
		// eslint-disable-next-line unicorn/no-hex-escape
		process.stdout.write('\x1B[2K');
		// Move	cursor up one line
		// eslint-disable-next-line unicorn/no-hex-escape
		process.stdout.write('\x1B[F');
		// eslint-disable-next-line unicorn/no-hex-escape
		process.stdout.write('\x1B[2K');
	}
};

export const useChat = (
	model: LanguageModelV1 | undefined,
	messages: CoreMessage[],
	mcpKeys: string[],
	streamingMode?: boolean,
) => {
	const {stdout} = useStdout();
	const [isStreaming, setIsStreaming] = useState(false);
	const [agentMessages, setAgentMessages] = useState<CoreMessage[]>([]);
	const {isFetching, data, ...rest} = useQuery({
		queryKey: ['use-chat', model, messages, mcpKeys, streamingMode],
		async queryFn() {
			if (messages.at(-1)?.role !== 'user' || !model) {
				return [];
			}
			const maxSteps = getConfig().maxSteps ?? 90;
			const tools = await getMcpTools(mcpKeys);

			if (streamingMode) {
				const {textStream, response} = streamText({
					model,
					messages,
					tools,
					maxSteps,
				});
				const reader = textStream.getReader();
				let chunks = '';
				reader.read().then(function processText({done, value}) {
					const next = value ? Chalk.dim.gray(value) : '';
					if (done) {
						chunks += next;
						stdout.write(next);
						clearLines((chunks.match(/\n/g) ?? []).length);
						setIsStreaming(false);
						return;
					}

					setIsStreaming(true);
					stdout.write(next);
					chunks += next;
					reader.read().then(processText);
				});
				const res = await response;
				// streaming mode might return multiple agent messages
				setAgentMessages(prev => [...prev, ...res.messages]);
				return res.messages;
			}

			const {response} = await generateText({
				model,
				messages,
				tools,
				maxSteps,
			});
			return response.messages;
		},
	});
	return {
		data: streamingMode ? agentMessages : data,
		isFetching,
		isStreaming,
		...rest,
	};
};
