import {Box, Text} from 'ink';
import {pick} from 'lodash-es';
import React, {type FC} from 'react';

export const chatHandles = {
	// quick commands
	HELP: '/help',
	EXIT: '/exit',
	RESET: '/reset',
	COPY: '/copy',
	LLM: '/llm',

	// params
	FILE: '@file',
	MCP: '@mcp',
	CLIP: '@clip',
};

export const suggestions = Object.values(chatHandles);

export const descriptions: {[key in keyof typeof chatHandles]: string} = {
	HELP: 'Quick help',
	EXIT: 'Exit Hanabi CLI',
	RESET: 'Reset current chat',
	COPY: 'Copy last agent message onto clipboard',
	LLM: 'Change language model',

	FILE: 'Add files',
	MCP: 'Use MCP',
	CLIP: 'Use clipboard text',
};

export const ChatHandles: FC = () => {
	return (
		<Box paddingX={1} marginTop={0} flexWrap="wrap">
			{Object.entries(pick(descriptions, 'HELP', 'FILE', 'MCP')).map(
				([key, desp]) => (
					<Box key={key} height={1}>
						<Text backgroundColor="gray" bold>
							{chatHandles[key as keyof typeof chatHandles]}
						</Text>
						<Text color="gray"> {desp} </Text>
					</Box>
				),
			)}
		</Box>
	);
};
