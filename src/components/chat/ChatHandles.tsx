import React, { FC } from 'react';
import { Box, Text } from 'ink';

export const chatHandles = {
	// quick commands
	EXIT: '/exit',
	RESET: '/reset',
	COPY: '/copy',
	LLM: '/llm',

	// params
	FILE: '@file',
	MCP: '@mcp',
};

export const suggestions = Object.values(chatHandles);

export const descriptions: {[key in keyof typeof chatHandles]: string} = {
	EXIT: 'Exit Hanabi',
	RESET: 'Reset chat',
	COPY: 'Last Msg',
	FILE: 'Add file',
	MCP: 'Use MCP',
	LLM: 'change llm',
};

export const ChatHandles: FC = () => {
	return (
		<Box paddingX={1} marginTop={0} flexWrap="wrap">
			{Object.entries(descriptions).map(([key, desp]) => (
				<Box key={key} height={1}>
					<Text backgroundColor="gray" bold>
						{chatHandles[key as keyof(typeof chatHandles)]}
					</Text>
					<Text color="gray"> {desp} </Text>
				</Box>
			))}
		</Box>
	);
};
