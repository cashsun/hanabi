import Markdown from '@inkkit/ink-markdown';
import {CoreAssistantMessage, CoreMessage, CoreSystemMessage, TextPart, UserContent} from 'ai';
import clipboardy from 'clipboardy';
import dedent from 'dedent';
import {Box, Text} from 'ink';

import React, {FC, useEffect, useMemo, useState} from 'react';
import {useChat} from '../../hooks/useChat.js';
import {getModel} from '../../hooks/useListModels.js';
import {DefaultModelPicker} from '../config/DefaultModelPicker.js';
import {getConfig} from '../config/util.js';
import {ChatInput} from './ChatInput.js';
import {descriptions, chatHandles} from './ChatHandles.js';

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

const systemMessage: CoreSystemMessage = {
	role: 'system',
	content: `
	Act as an AI assistant with access to various tools (if provided). 
	User might be using a terminal interface to interact with you.
	
	## Help Documentation
	when user ask for help on how to use the terminal interface (e.g. when user says "/help")
	show the following help documenation
	
	\'\'\'markdown
	Here are the list of commands and tools you can use

	${Object.entries(descriptions)
		.map(([key, desp]) => {
			return `${chatHandles[key as keyof typeof chatHandles]}\t${desp}`;
		})
		.join('\n\n')} \n
	\'\'\'
	
	`,
};

export const Chat: FC<{singleRunQuery?: string}> = ({singleRunQuery}) => {
	const config = useMemo(() => getConfig(), []);

	const [defaultModel, setDefaultModel] = useState(config.defaultModel);
	const model = getModel(config.llms, defaultModel);
	const [messages, setMessages] = React.useState<CoreMessage[]>(
		singleRunQuery && singleRunQuery !== '1'
			? [{role: 'user', content: singleRunQuery}]
			: [systemMessage],
	);
	const [mcpKeys, setMcpKeys] = useState<string[]>([]);
	const {data, isFetching, error} = useChat(model, messages, mcpKeys);
	useEffect(() => {
		if (data && !error) {
			setMessages(prev => [...prev, ...data]);
		}
	}, [data]);

	if (messages.at(-1)?.role === 'assistant' && singleRunQuery) {
		let message = '';
		const lastMessage = messages.at(-1);
		if (Array.isArray(lastMessage?.content)) {
			message = (lastMessage.content as TextPart[]).find(c => c.type === 'text')?.text ?? '';
		} else {
			message = lastMessage?.content.toString() ?? '';
		}
		return (
			<Text>
				<Markdown>{dedent`${message}`}</Markdown>
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
				onReset={() => setMessages([systemMessage])}
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
							{role: 'assistant', content: 'Copied to clipboard!'},
						]);
					}
				}}
				onLLM={() => {
					const config = getConfig();
					setDefaultModel(config.defaultModel);
					setMessages([systemMessage]);
				}}
				onSubmit={(msg, keys) => {
					setMcpKeys(keys);
					setMessages(prev => [...prev, {role: 'user', content: msg}]);
				}}
			/>
		</Box>
	);
};
