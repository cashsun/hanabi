import {useQuery} from '@tanstack/react-query';
import type {
	CoreMessage,
	LanguageModelV1,
	StreamTextResult,
	ToolChoice,
} from 'ai';
import {generateText, streamText, tool, jsonSchema} from 'ai';
import {useState} from 'react';
import {getConfig} from '../components/config/util.js';
import {getMcpTools} from './useMcpTools.js';
import {useStdout} from 'ink';
import Chalk from 'chalk';
import {EOL} from 'node:os';
import {v4 as uniqueId} from 'uuid';

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

function formatAnswer(
	messages: Awaited<StreamTextResult<any, any>['response']>['messages'],
	toolCalls: Awaited<StreamTextResult<any, any>['toolCalls']>,
	answerSchema: HanabiConfig['answerSchema'],
	useAnswerSchema: boolean,
) {
	const list = messages;
	if (answerSchema && toolCalls.at(-1) && useAnswerSchema) {
		// formated answer mode does not have agent response.
		// we need to add manually
		const answerCall = toolCalls.at(-1)!;

		list.push(
			{
				id: answerCall.toolCallId,
				role: 'tool',
				content: [
					{
						type: 'tool-result',
						toolCallId: answerCall.toolCallId,
						toolName: answerCall.toolName,
						result: answerCall.args,
					},
				],
			},
			{
				id: uniqueId(),
				role: 'assistant',
				content: [
					{
						type: 'text',
						text: JSON.stringify(answerCall.args, null, 2),
					},
				],
			},
		);
	}
	return list;
}

export const useChat = ({
	model,
	messages,
	mcpKeys,
	streamingMode,
	useAnswerSchema,
}: {
	model: LanguageModelV1 | undefined;
	messages: CoreMessage[];
	mcpKeys: string[] | undefined;
	streamingMode?: boolean;
	useAnswerSchema?: boolean;
}) => {
	const {stdout} = useStdout();
	const [isStreaming, setIsStreaming] = useState(false);
	const [agentMessages, setAgentMessages] = useState<CoreMessage[]>([]);
	const {isFetching, data, ...rest} = useQuery({
		queryKey: ['use-chat', model, messages, mcpKeys, streamingMode],
		async queryFn() {
			if (messages.at(-1)?.role !== 'user' || !model || isStreaming) {
				return [];
			}

			const config = getConfig();
			const maxSteps = config.maxSteps ?? 10;
			let tools = await getMcpTools(mcpKeys);
			let toolChoice: ToolChoice<any> = 'auto';
			if (config.answerSchema && useAnswerSchema) {
				toolChoice = 'required';
				tools = {
					...tools,
					'format-answer': tool({
						description: 'A tool for providing the final answer.',
						parameters: jsonSchema(config.answerSchema),
					}),
				};
			}

			if (streamingMode) {
				const {fullStream, response, toolCalls} = streamText<typeof tools>({
					model,
					messages,
					tools,
					maxSteps,
					toolChoice,
					onError({error}) {
						process.stdin.resume();
						throw error;
					},
				});

				let chunks = '';
				let awaitingFirstChunk = true;
				for await (const value of fullStream) {
					setIsStreaming(true);
					// wait for the spinner redraw
					if (awaitingFirstChunk) {
						await new Promise(resolve => {
							setTimeout(resolve, 1);
						});
						// only wait for the first time
						awaitingFirstChunk = false;
					}

					if (value.type === 'reasoning' || value.type === 'text-delta') {
						const next = Chalk.dim.gray(value.textDelta);
						stdout.write(next);

						if (value.type === 'text-delta') {
							chunks += next;
						}
					}
					if (value.type === 'tool-call') {
						const next = Chalk.gray(value.toolName);
						stdout.write(`\n ⟡ tool call: ${next}\n`);
						if (value.toolName === 'format-anwser') {
							stdout.write(
								`\n ⟡ formated Answer: ${Chalk.gray(
									JSON.stringify(value.args, null, 2),
								)}\n`,
							);
						}
					}
				}
				const res = await response;
				if (res.messages.length) {
					const list = formatAnswer(
						res.messages,
						await toolCalls,
						config.answerSchema,
						!!useAnswerSchema,
					);
					setAgentMessages(prev => [...prev, ...list]);
				}
				setIsStreaming(false);
				clearLines(chunks.split(EOL).length);

				// in stream mode we will use agent messages
				return [];
			}

			// non-streaming mode
			const {response, toolCalls} = await generateText({
				model,
				messages,
				tools,
				maxSteps,
				toolChoice,
			});
			return formatAnswer(
				response.messages,
				toolCalls,
				config.answerSchema,
				!!useAnswerSchema,
			);
		},
	});
	return {
		data: streamingMode ? agentMessages : data,
		isFetching,
		isStreaming: isStreaming && !rest.error,
		...rest,
	};
};
