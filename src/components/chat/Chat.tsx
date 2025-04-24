import {createAzure} from '@ai-sdk/azure';
import {deepseek} from '@ai-sdk/deepseek';
import {google} from '@ai-sdk/google';
import {openai} from '@ai-sdk/openai';
import {createOpenAICompatible} from '@ai-sdk/openai-compatible';
import {Spinner, TextInput} from '@inkjs/ui';
import Markdown from '@inkkit/ink-markdown';
import {CoreMessage} from 'ai';
import {Box, Text} from 'ink';
import {map} from 'lodash-es';
import {ollama} from 'ollama-ai-provider';
import React, {useEffect, useMemo, useState} from 'react';
import {useChat} from '../../hooks/useChat.js';
import {DefaultModelPicker} from '../config/DefaultModelPicker.js';
import {DEFAULT_API_VERSION, getConfig} from '../config/util.js';
import {chatHandles, descriptions} from './chatHandles.js';

const getModel = (
	llms: HanabiConfig['llms'],
	defaultModel: HanabiConfig['defaultModel'],
) => {
	const llm = llms.find(l => l.id === defaultModel?.id);
	if (!llm || !defaultModel) {
		return undefined;
	}
	if (llm.provider === 'Google') {
		return google(defaultModel.model);
	}
	if (llm.provider === 'Azure') {
		const azure = createAzure({
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
	const [input, setInput] = useState('');
	const {data, isFetching, isLoading, error} = useChat(model, messages);
	const pickingFile = new RegExp(`${chatHandles.FILE} $`).test(input);

	useEffect(() => {
		if (data && !error) {
			setMessages(prev => [...prev, {role: 'assistant', content: data}]);
		}
	}, [data]);

	if (error) {
		return <Text color="red">{error.message}</Text>;
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
		<Box flexDirection="column">
			{!!messages.length &&
				messages.map((message, index) => {
					if (message.role === 'user') {
						return (
							<Box marginTop={1} key={index}>
								<Text color="gray">User: {message.content.toString()}</Text>
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
							<Text color="green">
								<Markdown>{`⟡ ${message.content.toString()}`}</Markdown>
							</Text>
						</Box>
					);
				})}

			<Box borderColor="blueBright" borderStyle="round" paddingX={1}>
				<Text color="blueBright" bold>
					Chat {'>'}{' '}
				</Text>
				{isFetching && <Spinner label=" Thinking..." />}
				{!isLoading && (
					<TextInput
						placeholder={` ${defaultModel.model}`}
						onChange={setInput}
						onSubmit={msg => {
							if (new RegExp(`${chatHandles.EXIT}`, 'gi').test(msg)) {
								process.exit(0);
							}
							setMessages(prev => [...prev, {role: 'user', content: msg}]);
						}}
					/>
				)}
			</Box>
			{/* handles */}
			<Box gap={1} paddingX={1} marginTop={0}>
				{map(descriptions, (desp: string, key: keyof typeof chatHandles) => (
					<Box key={key}>
						<Text backgroundColor="gray" bold>
							{chatHandles[key]}
						</Text>
						<Text> {desp}</Text>
					</Box>
				))}
			</Box>
		</Box>
	);
};
