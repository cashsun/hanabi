import type {CoreSystemMessage} from 'ai';
import {chatHandles, descriptions} from '../components/chat/ChatHandles.js';
import {resolve} from 'node:path';
import fs from 'node:fs';
import {loadConfigToEnv} from '../components/config/util.js';
import Chalk from 'chalk';

const getDefaultSystemMessage = (): CoreSystemMessage => ({
	role: 'system',
	content: `
	Act as an AI assistant with access to various tools (if provided). 
	User might be using a terminal interface to interact with you.
	
	## Context
	- Today is ${new Date().toDateString()}
	- Chat started at ${new Date().toTimeString()}
	- Timezone is ${new Intl.DateTimeFormat().resolvedOptions().timeZone}

	## Help Documentation
	- when user ask for help on how to use the terminal interface (e.g. when user says "/help"), present the help documenation below in a simple format. 
	- Make sure to differentiate the action handlers (Commands starting with '/') and context handlers (Commands starting with '@')
	- 'mcp' refers Model Context Provider, mcp servers provide all sorts of amazing skills

	Here are the list of commands and tools user can use

	${Object.entries(descriptions)
		.map(([key, desp]) => {
			return `${chatHandles[key as keyof typeof chatHandles]}\t${desp}`;
		})
		.join('\n\n')} 
	
	`,
});

export const getSystemMessages = (): CoreSystemMessage[] => {
	loadConfigToEnv();
	const messages: CoreSystemMessage[] = [getDefaultSystemMessage()];
	const systemPromptPath = resolve(process.cwd(), 'hanabi.system.prompt.md');
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
