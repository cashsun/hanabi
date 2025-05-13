import {Select} from '@inkjs/ui';
import Chalk from 'chalk';
import {Box, Text, useInput, useStdout} from 'ink';
import fs from 'node:fs';
import {resolve} from 'node:path';
import React, {type FC, useEffect, useState} from 'react';
import {defaultConfig, updateConfig} from './util.js';
import type {jsonSchema} from 'ai';

type TemplateName =
	| '.hanabi.json'
	| 'hanabi.system.prompt.md'
	| keyof Pick<HanabiConfig, 'answerSchema' | 'multiAgents'>;

const samplePrompt = `\n
# Now, act as a polite chat bot collecting user feedback via conversational loop. 

## ask user the follwing questions one by one and prints a well formatted report
- What is your name
- How do you feel about our product? (classify answer as "Bad" | "OK" | "great")
- What is your company\n
`;

const sampleAnswerSchema: Parameters<typeof jsonSchema>[0] = {
	type: 'object',
	required: ['answer'],
	properties: {
		reason: {type: 'string', description: 'Reasoning details'},
		answer: {type: 'string', description: 'Final answer'},
	},
};

const coreTemplates: {label: string; value: TemplateName}[] = [
	{
		label: 'Local config',
		value: '.hanabi.json',
	},
	{
		label: 'Custom system prompt',
		value: 'hanabi.system.prompt.md',
	},
	{
		label: 'Answer Schema',
		value: 'answerSchema',
	},
	{
		label: 'Multi Agens Strategy',
		value: 'multiAgents',
	},
];

const strategies: {
	label: string;
	value: MultiAgentsStrategy['strategy'];
}[] = [
	{
		label: 'Routing (classification)',
		value: 'routing',
	},
	{
		label: 'Workflow (sequential)',
		value: 'workflow',
	},
];

const sampleRoutingStrategy: RoutingStrategy = {
	strategy: 'routing',
	force: false,
	agents: [
		{
			name: 'calendars',
			apiUrl: 'http://localhost:3051/api',
			classification: 'school calendar events and UK public holiday',
		},
		{
			name: 'math',
			apiUrl: 'http://localhost:3052/api',
			classification: 'math problem',
		},
		{
			name: 'api-doc',
			apiUrl: 'http://localhost:3053/api',
			classification: 'API document',
		},
	],
};

const sampleWorkflowStrategy: WorkflowStrategy = {
	strategy: 'workflow',
	steps: [
		{
			apiUrl: 'http://localhost:3051/api',
			name: 'process trade instruction',
		},

		{
			apiUrl: 'http://localhost:3052/api',
			name: 'trade booking with payload',
		},
	],
};

export const TemplateGenerater: FC<{
	onComplete?: (f?: string) => void;
}> = ({onComplete}) => {
	const [filePath, setFilePath] = useState('');
	const [secondaryMode, setSecondaryMode] = useState<'multiAgents'>();
	const {stdout} = useStdout();
	useInput(
		(t, key) => {
			if (key.escape) {
				onComplete?.();
			}
		},
		{isActive: !filePath},
	);
	useEffect(() => {
		if (filePath) {
			stdout.write(`\n${Chalk.green('✓')} created ${Chalk.gray(filePath)}\n`);
			if (filePath.endsWith('.hanabi.json')) {
				stdout.write(`${Chalk.yellow('! Do not share this file.')}\n`);
			}
			onComplete?.(filePath);
		}
	}, [filePath, onComplete, stdout]);

	if (secondaryMode === 'multiAgents') {
		return (
			<Box flexDirection="column">
				<Text color="green">⟡ Select a strategy:</Text>
				<Select
					options={strategies}
					visibleOptionCount={10}
					onChange={v => {
						switch (v as MultiAgentsStrategy['strategy']) {
							case 'routing': {
								// updateConfig is a deep merge, we clear the whole setting first.
								const updatePath = updateConfig(
									{
										multiAgents: sampleRoutingStrategy,
									},
									true,
								);
								stdout.write(
									`\n${Chalk.green('✓')} updated ${Chalk.gray(updatePath)}\n`,
								);
								break;
							}
							case 'workflow': {
								const updatePath = updateConfig(
									{
										multiAgents: sampleWorkflowStrategy,
									},
									true,
								);
								stdout.write(
									`\n${Chalk.green('✓')} updated ${Chalk.gray(updatePath)}\n`,
								);
								break;
							}
							default:
								break;
						}
						onComplete?.();
					}}
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text color="green">⟡ Select a template below:</Text>
			<Select
				options={coreTemplates}
				visibleOptionCount={10}
				onChange={v => {
					const dest = resolve(process.cwd(), v);
					switch (v as TemplateName) {
						case '.hanabi.json': {
							fs.writeFileSync(
								dest,
								JSON.stringify(defaultConfig, null, 2),
								'utf8',
							);
							setFilePath(dest);
							break;
						}
						case 'hanabi.system.prompt.md': {
							fs.writeFileSync(dest, samplePrompt, 'utf8');
							setFilePath(dest);
							break;
						}
						case 'answerSchema': {
							const updatePath = updateConfig(
								{
									answerSchema: sampleAnswerSchema,
								},
								true,
							);
							stdout.write(
								`\n${Chalk.green('✓')} updated ${Chalk.gray(updatePath)}\n`,
							);
							onComplete?.();
							break;
						}
						case 'multiAgents': {
							setSecondaryMode('multiAgents');
							break;
						}
						default:
							break;
					}
				}}
			/>
		</Box>
	);
};
