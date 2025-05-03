import Markdown from '@inkkit/ink-markdown';
import type {CoreUserMessage, TextPart, UserContent} from 'ai';
import dedent from 'dedent';
import {Box, Newline, Static, Text} from 'ink';

import React, {type FC, useEffect, useMemo, useState} from 'react';
import {useChat} from '../../hooks/useChat.js';
import {useModel} from '../../hooks/useListModels.js';
import {addMessages, useAppStore} from '../../store/appState.js';
import {DefaultModelPicker} from '../config/DefaultModelPicker.js';
import {getConfig} from '../config/util.js';
import {getFinalMsg} from './ChatInput.js';
import Spinner from 'ink-spinner';

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

interface Props {
	prompt: string;
	mcpKeys?: string[];
	files?: string[];
	isWithClip?: boolean;
	/** signal repl to unmount this component and proceed to next step */
	onComplete: () => void;
	isSingleRunQuery?: boolean;
}

export const Chat: FC<Props> = ({
	prompt,
	mcpKeys,
	files,
	isWithClip,
	onComplete,
	isSingleRunQuery,
}) => {
	const config = useMemo(() => getConfig(), []);

	const [defaultModel, setDefaultModel] = useState(config.defaultModel);
	const model = useModel(defaultModel);
	const msgHistory = useAppStore(state => state.messages);
	const userMessage: CoreUserMessage = useMemo(
		() => ({
			role: 'user',
			content: getFinalMsg(
				defaultModel,
				prompt,
				files ?? [],
				isWithClip ?? false,
			),
		}),
		[defaultModel, prompt, files, isWithClip],
	);
	useEffect(() => {
		if (userMessage) {
			addMessages([userMessage]);
		}
	}, [userMessage]);

	const {data, isFetching, isStreaming, error} = useChat(
		model,
		msgHistory,
		mcpKeys ?? [],
		config.streaming && !isSingleRunQuery,
	);

	const userMessageDisplay = useMemo(() => {
		return userMessage ? (
			<Box marginTop={1} flexDirection="column">
				<Text color="gray">
					User {'>'} {formatUserMessage(userMessage.content)}
				</Text>
				{mcpKeys?.map(mcp => (
					<Text key={mcp} color="gray">{`@mcp: ${mcp}`}</Text>
				))}
			</Box>
		) : null;
	}, [userMessage, mcpKeys]);

	useEffect(() => {
		if (!isFetching && !isStreaming && (data?.length || error)) {
			if (data?.length) {
				addMessages(data);
			}
			onComplete();
		}
	}, [isFetching, data, error, onComplete, isStreaming]);

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

	if (isSingleRunQuery) {
		if (error) {
			return <Text color="red">Error: {error.message}</Text>;
		}
		if (data?.at(-1)?.role === 'assistant') {
			let message = '';
			const lastMessage = data.at(-1);
			if (Array.isArray(lastMessage?.content)) {
				message =
					(lastMessage.content as TextPart[]).find(c => c.type === 'text')
						?.text ?? '';
			} else {
				message = lastMessage?.content ?? '';
			}
			return (
				<Static items={[message]}>
					{item => (
						<Box key={item}>
							<Newline />
							<Markdown>{dedent`${item}`}</Markdown>
							<Newline />
						</Box>
					)}
				</Static>
			);
		}
		return null;
	}

	if (error) {
		return <Text color="red">{error.message}</Text>;
	}

	if (isStreaming) {
		return (
			<Text>
				<Text color="green">⠏</Text> Thinking...
			</Text>
		);
	}

	if (isFetching) {
		return (
			<Text>
				<Text color="green">
					<Spinner type="dots" />
				</Text>
				{' Thinking...'}
			</Text>
		);
	}

	return (
		<Box flexDirection="column" justifyContent="flex-end">
			{userMessageDisplay}
			{!!data?.length &&
				data.map((message, index) => {
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
											borderStyle="doubleSingle"
											borderLeft={false}
											borderRight={false}
											key={`${index}-${idx}`}
										>
											<Text color="magentaBright">⟡ {defaultModel.model}</Text>
											<Box paddingX={1}>
												<Markdown>{dedent`${part.text}`}</Markdown>
											</Box>
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
		</Box>
	);
};
