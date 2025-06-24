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
import {AgentMessage} from './AgentMessage.js';
import {useMultiAgentsChat} from '../../hooks/useMultiAgentsChat.js';
import {NO_CLASSIFICATION} from '../../constants.js';

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
	isWithAnswerSchema?: boolean;
	/** signal repl to unmount this component and proceed to next step */
	onComplete: () => void;
	isSingleRunQuery?: boolean;
	isMultiAgentsMode?: boolean;
}

export const Chat: FC<Props> = ({
	prompt,
	mcpKeys,
	files,
	isWithClip,
	isWithAnswerSchema,
	onComplete,
	isSingleRunQuery,
	isMultiAgentsMode,
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

	const multiAgentResult = useMultiAgentsChat({
		model,
		// turn off this branch by setting messages to empty
		messages: isMultiAgentsMode ? msgHistory : [],
	});
	const shouldPassThrough =
		!multiAgentResult.isLoading &&
		multiAgentResult.data?.at(-1)?.content === NO_CLASSIFICATION;

	const singleAgentResult = useChat({
		model,
		// turn off this branch by setting messages to empty
		messages: isMultiAgentsMode && !shouldPassThrough ? [] : msgHistory,
		mcpKeys,
		streamingMode: config.streaming && !isSingleRunQuery,
		useAnswerSchema: isWithAnswerSchema,
	});

	const resultToUse =
		isMultiAgentsMode && !shouldPassThrough
			? multiAgentResult
			: singleAgentResult;
	const {data, isFetching, isStreaming, error, usage} = resultToUse;

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
						return (
							<AgentMessage
								key={index}
								message={message}
								defaultModel={defaultModel}
							/>
						);
					}
					return null;
				})}
			{usage && (
				<Text color="gray">
					Token usage: {usage.totalTokens} (Prompt: {usage.promptTokens},
					Completion: {usage.completionTokens})
				</Text>
			)}
		</Box>
	);
};
