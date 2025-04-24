import {google} from '@ai-sdk/google';
import {getConfig} from '../config/util.js';
import React, {useEffect, useMemo} from 'react';
import {CoreMessage} from 'ai';
import {Box, Text} from 'ink';
import {Spinner, TextInput} from '@inkjs/ui';
import {useChat} from '../../hooks/useChat.js';
import Markdown from '@inkkit/ink-markdown';

export const Chat = () => {
	const config = useMemo(() => getConfig(), []);
	const defaultModel = config.defaultModel;
	const llm = config.llms.find(l => l.id === defaultModel.id);
	// TODO: switch model or use registry https://sdk.vercel.ai/docs/reference/ai-sdk-core/provider-registry#createproviderregistry
	const model = google(defaultModel.model);
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
				{!isFetching && !isLoading &&  (
					<TextInput
						placeholder={`Message ${defaultModel.model}`}
						onSubmit={msg => {
							setMessages(prev => [...prev, {role: 'user', content: msg}]);
						}}
					/>
				)}
			</Box>
		</Box>
	);
};
