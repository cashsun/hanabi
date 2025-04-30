import Markdown from '@inkkit/ink-markdown';
import type {CoreMessage, TextPart, UserContent} from 'ai';
import clipboardy from 'clipboardy';
import dedent from 'dedent';
import {Box, Text} from 'ink';

import React, {type FC, useEffect, useMemo, useState} from 'react';
import {useChat} from '../../hooks/useChat.js';
import {useModel} from '../../hooks/useListModels.js';
import {DefaultModelPicker} from '../config/DefaultModelPicker.js';
import {getConfig} from '../config/util.js';
import {ChatInput} from './ChatInput.js';
import {getSystemMessages} from '../../prompts/systemPrompts.js';

const formatUserMessage = (content: UserContent) => {
	if (Array.isArray(content)) {
		const text = content.find(c => c.type === 'text')?.text ?? '';
		if (text.length > 400) {
			return `${text.slice(0, 400)}...`;
		}
		return text;
	}

	return content.toString();
};

export const ChatUI: FC = () => {
	const config = useMemo(() => getConfig(), []);
	const systemMessages = useMemo(() => getSystemMessages(config), [config]);

	const [defaultModel, setDefaultModel] = useState(config.defaultModel);
	const model = useModel(defaultModel);
	const [messages, setMessages] = React.useState<CoreMessage[]>(systemMessages);
	const [mcpKeys, setMcpKeys] = useState<string[]>([]);
	const {data, isFetching, error} = useChat(model, messages, mcpKeys);
	useEffect(() => {
		if (data && !error) {
			setMessages(prev => [...prev, ...data]);
		}
	}, [data, error]);

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
			<Text dimColor color="yellow">
				Terminal might flick on Windows.
			</Text>
			{!!messages.length &&
				messages.map((message, index) => {
					if (message.role === 'user') {
						return (
							<Box marginTop={1} key={index} flexDirection="column">
								<Text color="gray">
									[User] {formatUserMessage(message.content)}
								</Text>
								{mcpKeys.map(mcp => (
									<Text key={mcp} color="gray">{`@mcp: ${mcp}`}</Text>
								))}
							</Box>
						);
					}

					if (message.role === 'assistant') {
						if (Array.isArray(message.content)) {
							return message.content.map((part, idx) => {
								if (part.type === 'tool-call') {
									return (
										<Box
											borderColor="magenta"
											borderStyle="doubleSingle"
											borderLeft={false}
											borderRight={false}
											borderBottom={false}
											paddingX={1}
											key={`${index}-${idx}`}
										>
											<Text color="magentaBright">⟡ tool: {part.toolName}</Text>
										</Box>
									);
								}

								if (part.type === 'text') {
									return (
										<Box
											borderColor="magenta"
											flexDirection="column"
											gap={1}
											paddingX={1}
											borderStyle="doubleSingle"
											borderLeft={false}
											borderRight={false}
											key={`${index}-${idx}`}
										>
											<Text color="magentaBright">⟡ {defaultModel.model}</Text>
											<Markdown>{dedent`${part.text}`}</Markdown>
										</Box>
									);
								}

								return null;
							});
						}
						return (
							<Box
								borderColor="magenta"
								borderStyle="doubleSingle"
								borderLeft={false}
								borderRight={false}
								paddingX={1}
								key={index}
							>
								<Markdown>{dedent`${message.content}`}</Markdown>
							</Box>
						);
					}
					return null;
				})}
			{error && <Text color="red">{error.message}</Text>}
			<ChatInput
				defaultModel={defaultModel}
				isFetching={isFetching}
				onReset={() => {
					setMessages(systemMessages);
				}}
				onCopy={() => {
					const lastMessage = messages.at(-1);
					if (lastMessage) {
						if (Array.isArray(lastMessage.content)) {
							clipboardy.writeSync(
								lastMessage.content.find(c => c.type === 'text')?.text ?? '',
							);
						} else {
							clipboardy.writeSync(lastMessage.content);
						}
						setMessages(prev => [
							...prev,
							{role: 'assistant', content: '⟡ Copied to clipboard!'},
						]);
					}
				}}
				onLLM={() => {
					const newConfig = getConfig();
					setDefaultModel(newConfig.defaultModel);
					setMessages(getSystemMessages(newConfig));
				}}
				onSubmit={(msg, keys) => {
					setMcpKeys(keys);
					setMessages(prev => [...prev, {role: 'user', content: msg}]);
				}}
			/>
		</Box>
	);
};
