import {useQuery} from '@tanstack/react-query';
import type {CoreMessage, LanguageModelV1} from 'ai';
import {generateText, streamText} from 'ai';
import {useState} from 'react';
import {getConfig} from '../components/config/util.js';
import {getMcpTools} from './useMcpTools.js';
import {useStdout} from 'ink';
import Chalk from 'chalk';
import {EOL} from 'node:os';

const clearLines = (n: number) => {
	for (let i = 0; i < n + 1; i++) {
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
	mcpKeys: string[] | undefined,
	streamingMode?: boolean,
) => {
	const {stdout} = useStdout();
	const [isStreaming, setIsStreaming] = useState(false);
	const [agentMessages, setAgentMessages] = useState<CoreMessage[]>([]);
	const {isFetching, data, ...rest} = useQuery({
		queryKey: ['use-chat', model, messages, mcpKeys, streamingMode],
		async queryFn() {
			if (messages.at(-1)?.role !== 'user' || !model || isStreaming) {
				return [];
			}
			const maxSteps = getConfig().maxSteps ?? 90;
			const tools = await getMcpTools(mcpKeys);
			if (streamingMode) {
				const {fullStream: textStream, response} = streamText({
					model,
					messages,
					tools,
					maxSteps,
				});

				let chunks = '';
				for await (const value of textStream) {
					setIsStreaming(true);
					if (value.type === 'reasoning' || value.type === 'text-delta') {
						const next = Chalk.dim.gray(value.textDelta);
						stdout.write('');
						stdout.write(next);

						if (value.type === 'text-delta') {
							chunks += next;
						}
					}
				}
				const res = await response;
				if (res.messages.length) {
					setAgentMessages(prev => [...prev, ...res.messages]);
				}
				setIsStreaming(false);
				clearLines(chunks.split(EOL).length);

				// in stream mode we will use agent messages
				return [];
			}

			// non-streaming mode
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
