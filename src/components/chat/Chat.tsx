import { createAzure } from '@ai-sdk/azure';
import { deepseek } from '@ai-sdk/deepseek';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { Spinner, TextInput } from '@inkjs/ui';
import Markdown from '@inkkit/ink-markdown';
import { CoreMessage } from 'ai';
import { Box, Text } from 'ink';
import { ollama } from 'ollama-ai-provider';
import React, { useEffect, useMemo, useState } from 'react';
import { useChat } from '../../hooks/useChat.js';
import { DEFAULT_API_VERSION, getConfig } from '../config/util.js';
import { DefaultModelPicker } from '../config/DefaultModelPicker.js';
import { ProviderPicker } from '../config/ProviderPicker.js';
import { createDeflate } from 'zlib';

const getModel = (llms: HanabiConfig['llms'], defaultModel: HanabiConfig['defaultModel']) => {
    const llm = llms.find(l => l.id === defaultModel?.id);
    if(!llm || !defaultModel){
        return undefined;
    }
	if (llm.provider === 'Google') {
		return google(defaultModel.model);
	}
	if (llm.provider === 'Azure') {
		const azure =  createAzure({
            apiVersion: llm.apiVersion ?? DEFAULT_API_VERSION,
        });
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
		baseURL: llm.apiUrl ?? '',
	});
	return compatible(defaultModel.model);
};

export const Chat = () => {
	const config = useMemo(() => getConfig(), []);
	const [defaultModel, setDefaultModel] = useState(config.defaultModel);
	const model = getModel(config.llms, defaultModel);
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

    if(!defaultModel){
        return <DefaultModelPicker onSelect={()=>{
            const config = getConfig();
            setDefaultModel(config.defaultModel);
        }} />
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
