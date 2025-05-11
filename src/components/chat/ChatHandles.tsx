import {Box, Text} from 'ink';
import {pick} from 'lodash-es';
import React, {type FC} from 'react';

export const chatHandles = {
	// quick commands
	HELP: '/help',
	EXIT: '/exit',
	RESET: '/reset',
	CLEAR: '/clear',
	COPY: '/copy',
	LLM: '/llm',
	GEN: '/gen',
	SERVE: '/serve',

	// params
	FILE: '@file',
	MCP: '@mcp',
	CLIP: '@clip',
	SCHEMA: '@schema',
};

export const suggestions = Object.values(chatHandles);

export const descriptions: {[key in keyof typeof chatHandles]: string} = {
	HELP: 'Quick help',
	EXIT: 'Exit Hanabi CLI',
	RESET: 'Reset current chat',
	CLEAR: 'Clear MCP and file selection',
	COPY: 'Copy last agent message onto clipboard',
	LLM: 'Change language model',
	GEN: 'generate hanabi templates',
	SERVE: 'start Hanabi UI server with current context',

	FILE: 'Add files',
	MCP: 'Use MCP server tools',
	CLIP: 'Use clipboard text',
	SCHEMA: 'use formatted answer schema',
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
