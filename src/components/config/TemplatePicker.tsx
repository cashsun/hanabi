import {Select} from '@inkjs/ui';
import Chalk from 'chalk';
import {Box, Text, useInput, useStdout} from 'ink';
import fs from 'node:fs';
import {resolve} from 'node:path';
import React, {type FC, useEffect, useState} from 'react';
import {defaultConfig} from './util.js';

type TemplateName = '.hanabi.json' | 'hanabi.system.prompt.md';

const samplePrompt = `\n
# act as a polite chat bot collecting user feedback via conversational loop. 

## ask user the follwing questions one by one and prints a well formatted report
- What is your name
- How do you feel about our product? (classify answer as "Bad" | "OK" | "great")
- What is your company\n
`;

export const templates: {label: string; value: TemplateName}[] = [
	{
		label: 'Local config',
		value: '.hanabi.json',
	},
	{
		label: 'Custom system prompt',
		value: 'hanabi.system.prompt.md',
	},
];

export const TemplatePicker: FC<{
	onComplete?: (f?: string) => void;
}> = ({onComplete}) => {
	const [filePath, setFilePath] = useState('');
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
			onComplete?.(filePath);
		}
	}, [filePath, onComplete, stdout]);

	return (
		<Box flexDirection="column">
			<Text color="green">⟡ Select a template below:</Text>
			<Select
				options={templates}
				visibleOptionCount={10}
				onChange={f => {
					const dest = resolve(process.cwd(), f);
					if ((f as TemplateName) === '.hanabi.json') {
						fs.writeFileSync(
							dest,
							JSON.stringify(defaultConfig, null, 2),
							'utf8',
						);
						setFilePath(dest);
					}
					if ((f as TemplateName) === 'hanabi.system.prompt.md') {
						fs.writeFileSync(dest, samplePrompt, 'utf8');
						setFilePath(dest);
					}
				}}
			/>
		</Box>
	);
};
