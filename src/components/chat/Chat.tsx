import { createAzure } from '@ai-sdk/azure';
import { deepseek } from '@ai-sdk/deepseek';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import Markdown from '@inkkit/ink-markdown';
import { CoreMessage, UserContent } from 'ai';
import clipboardy from 'clipboardy';
import dedent from 'dedent';
import { Box, Text } from 'ink';
import { last } from 'lodash-es';
import { ollama } from 'ollama-ai-provider';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { useChat } from '../../hooks/useChat.js';
import { DefaultModelPicker } from '../config/DefaultModelPicker.js';
import { DEFAULT_API_VERSION, getConfig } from '../config/util.js';
import { ChatInput } from './ChatInput.js';

const formatUserMessage = (content: UserContent) => {
	if (Array.isArray(content)) {
		const text = content.find(c => c.type === 'text')?.text ?? '';
		if (text.length > 200) {
			return `${text.slice(0, 200)}...`;
		}
		return text;
	}

	return content.toString();
};

const getModel = (
	llms: HanabiConfig['llms'],
	defaultModel: HanabiConfig['defaultModel'],
) => {
	const llm = llms.find(l => l.id === defaultModel?.id);
	if (!llm || !defaultModel) {
		return undefined;
	}
	const modelName = defaultModel.model; // Extract model name for clarity

	switch (llm.provider) {
		case 'Google':
			return google(modelName);
		case 'Azure': {
			const azure = createAzure({
				apiVersion: llm.apiVersion ?? DEFAULT_API_VERSION,
			});
			return azure(modelName);
		}
		case 'Deepseek':
			return deepseek(modelName);
		case 'OpenAI':
			return openai(modelName);
		case 'Ollama':
			return ollama(modelName);
		default: {
			// OpenAI Compatible
			const compatible = createOpenAICompatible({
				name: llm.provider,
				apiKey: llm.apiKey,
				baseURL: llm.apiUrl ?? '',
			});
			return compatible(modelName);
		}
	}
};

export const Chat: FC<{singleRunQuery?: string}> = ({singleRunQuery}) => {
	const config = useMemo(() => getConfig(), []);

	const [defaultModel, setDefaultModel] = useState(config.defaultModel);
	const model = getModel(config.llms, defaultModel);
	const [messages, setMessages] = React.useState<CoreMessage[]>(
		singleRunQuery && singleRunQuery !== '1'
			? [{role: 'user', content: singleRunQuery}]
			: [],
	);
	const {data, isFetching, error} = useChat(model, messages);

	useEffect(() => {
		if (data && !error) {
			setMessages(prev => [...prev, {role: 'assistant', content: data}]);
		}
	}, [data]);

	if (messages.length === 2 && singleRunQuery) {
		return (
			<Text>
				<Markdown>{dedent`${messages[1]?.content.toString()}`}</Markdown>
			</Text>
		);
	}

	if (!defaultModel) {
		return (
			<DefaultModelPicker
				onSelect={() => {
					const config = getConfig();
					setDefaultModel(config.defaultModel);
				}}
			/>
		);
	}

	return (
		<Box
			flexDirection="column"
			justifyContent="flex-end"
			minHeight={process.stdout.rows - 1}
		>
			{!!messages.length &&
				messages.map((message, index) => {
					if (message.role === 'user') {
						return (
							<Box marginTop={1} key={index}>
								<Text color="gray">
									[User] {formatUserMessage(message.content)}
								</Text>
							</Box>
						);
					}
					return (
						<Box
							borderColor="magenta"
							borderStyle="doubleSingle"
							paddingX={1}
							key={index}
						>
							<Markdown>{dedent`${message.content.toString()}`}</Markdown>
						</Box>
					);
				})}
			{error && <Text color="red">{error.message}</Text>}
			<ChatInput
				defaultModel={defaultModel}
				isFetching={isFetching}
				onReset={() => setMessages([])}
				onCopy={() => {
					const lastMessage = last(messages);
					if (lastMessage) {
						clipboardy.writeSync(lastMessage.content.toString());
						setMessages(prev => [
							...prev,
							{role: 'assistant', content: 'Copied to clipboard!'},
						]);
					}
				}}
				onLLM={() => {
					const config = getConfig();
					setDefaultModel(config.defaultModel);
				}}
				onSubmit={msg =>
					setMessages(prev => [...prev, {role: 'user', content: msg}])
				}
			/>
		</Box>
	);
};
