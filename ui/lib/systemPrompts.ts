import type {CoreSystemMessage} from 'ai';
import {join, resolve} from 'node:path';
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

	## Built-in Tools
	- \`run-shell-command\`: Run a shell command in the current working directory. Always ask user for confirmation before running. 
	If necessary, read relavant project setup files (e.g. package.json) within working directly to find the correct commands.

	`,
});

export const getSystemMessages = (): CoreSystemMessage[] => {
	loadConfigToEnv();
	const messages: CoreSystemMessage[] = [getDefaultSystemMessage()];
	const pwd =
		process.env['HANABI_PWD'] ?? join(process.cwd(), '/do/not/exist/');
	const systemPromptPath = resolve(pwd, 'hanabi.system.prompt.md');
	if (fs.existsSync(systemPromptPath)) {
		const source = fs.readFileSync(systemPromptPath, 'utf8');
		const lookupKeys = new Set(
			source.match(/(\${\w+})/g)?.map(p => p.replace(/[${}]/g, '')),
		);
		let content = source;

		for (const lookUp of lookupKeys) {
			const envVal = process.env[lookUp];
			if (!envVal) {
				console.log(
					Chalk.yellow(`!!! System prompt file: missing env "${lookUp}"`),
				);
			} else {
				if (envVal.startsWith('file://')) {
					const fileContent = fs.readFileSync(
						resolve(pwd, envVal.replace('file://', '')),
						'utf8',
					);
					content = content.replace(
						`\${${lookUp}}`,
						`\`\`\`\n${fileContent}\n\`\`\``,
					);
				} else {
					content = content.replace(`\${${lookUp}}`, envVal);
				}
			}
		}
		messages.push({
			role: 'system',
			content,
		});
	}

	return messages;
};
