import type {CoreSystemMessage} from 'ai';
import {resolve} from 'node:path';
import fs from 'node:fs';
import {loadConfigToEnv} from './config';
import Chalk from 'chalk';

const getDefaultSystemMessage = (): CoreSystemMessage => ({
	role: 'system',
	content: `
	
	## Context
	- Today is ${new Date().toDateString()}
	- Chat started at ${new Date().toTimeString()}
	- Timezone is ${new Intl.DateTimeFormat().resolvedOptions().timeZone}

	`,
});

export const getSystemMessages = (): CoreSystemMessage[] => {
	loadConfigToEnv();
	const messages: CoreSystemMessage[] = [getDefaultSystemMessage()];
	const systemPromptPath = resolve(
		process.env['HANABI_PWD'] ?? 'do/not/exist/',
		'hanabi.system.prompt.md',
	);
	if (fs.existsSync(systemPromptPath)) {
		const source = fs.readFileSync(systemPromptPath, 'utf8');
		const lookupKeys = new Set(
			source.match(/(\${\w+})/g)?.map(p => p.replace(/[${}]/g, '')),
		);
		let content = source;

		for (const lookUp of lookupKeys) {
			if (!process.env[lookUp]) {
				console.log(
					Chalk.yellow(`System prompt file: missing env "${lookUp}"`),
				);
			} else {
				content = content.replace(`\${${lookUp}}`, process.env[lookUp]);
			}
		}

		messages.push({
			role: 'system',
			content,
		});
	}

	return messages;
};
