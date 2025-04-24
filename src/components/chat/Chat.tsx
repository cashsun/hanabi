import { azure } from '@ai-sdk/azure';
import { deepseek } from '@ai-sdk/deepseek';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { Spinner, TextInput } from '@inkjs/ui';
import Markdown from '@inkkit/ink-markdown';
import { CoreMessage } from 'ai';
import { Box, Text } from 'ink';
import { ollama } from 'ollama-ai-provider';
import React, { useEffect, useMemo } from 'react';
import { useChat } from '../../hooks/useChat.js';
import { getConfig } from '../config/util.js';

const getModel = (config: HanabiConfig) => {
	const defaultModel = config.defaultModel;

	const llm = config.llms.find(l => l.id === defaultModel.id);
	if (llm.provider === 'Google') {
		return google(defaultModel.model);
	}
	if (llm.provider === 'Azure') {
		return azure(defaultModel.model);
	}
	if (llm.provider === 'Deepseek') {
		return deepseek(defaultModel.model);
	}
	if (llm.provider === 'OpenAI') {
		return openai(defaultModel.model);
	}

	if (llm.provider === 'Ollama') {
		return ollama(defaultModel.model);
	}
	const compatible = createOpenAICompatible({
		name: llm.provider,
        apiKey: llm.apiKey,
		baseURL: llm.apiUrl,
	});
	return compatible(defaultModel.model);
};

export const Chat = () => {
	const config = useMemo(() => getConfig(), []);
	const defaultModel = config.defaultModel;
	// TODO: switch model or use registry https://sdk.vercel.ai/docs/reference/ai-sdk-core/provider-registry#createproviderregistry
	const model = getModel(config);
	const [messages, setMessages] = React.useState<CoreMessage[]>([]);
	const {data, isFetching, isLoading, error} = useChat(model, messages);
	useEffect(() => {
		if (data && !error) {
			setMessages(prev => [...prev, {role: 'assistant', content: data}]);
		}
	}, [data]);
	const lastAssistentMessage = messages
		.slice()
		.reverse()
		.find(m => m.role === 'assistant');

	if (error) {
		return <Text color="red">{error.message}</Text>;
	}
	return (
		<Box flexDirection="column" gap={1}>
			{!isFetching && lastAssistentMessage && (
				<Text color="green">
					<Markdown>{`⟡ ${lastAssistentMessage.content.toString()}`}</Markdown>
				</Text>
			)}
			{isFetching && <Spinner label="⟡ Thinking..." />}

			<Box borderColor="blueBright" borderStyle="round" paddingX={1}>
				<Text color="blueBright">CHAT </Text>
				{!isFetching && !isLoading && (
					<TextInput
						placeholder={` ${defaultModel.model}`}
						onSubmit={msg => {
							setMessages(prev => [...prev, {role: 'user', content: msg}]);
						}}
					/>
				)}
			</Box>
		</Box>
	);
};
