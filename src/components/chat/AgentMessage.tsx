import Markdown from '@inkkit/ink-markdown';
import type {CoreMessage} from 'ai';
import dedent from 'dedent';
import {Box, Text} from 'ink';

import React, {type FC} from 'react';

interface Props {
	message: CoreMessage;
	defaultModel: HanabiConfig['defaultModel'];
}

export const AgentMessage: FC<Props> = ({message, defaultModel}) => {
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
						key={`${idx}`}
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
						key={`${idx}`}
					>
						<Text color="magentaBright">⟡ {defaultModel?.model}</Text>
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
		>
			<Markdown>{dedent`${message.content}`}</Markdown>
		</Box>
	);
};
