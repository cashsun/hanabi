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
	User is using a terminal interface to interact with you.
	
	## Context
	- Today: ${new Date().toDateString()}
	- Chat started at: ${new Date().toTimeString()}
	- Timezone: ${new Intl.DateTimeFormat().resolvedOptions().timeZone}

	## Help Documentation
	- when user ask for help, present the help documenation below in a simple format. 
	- Make sure to differentiate the action handlers (Commands starting with '/') and context handlers (Commands starting with '@')
	- 'mcp' refers to Model Context Protocol, mcp servers provide agent skills
	- type './' and hit tab to auto complete target folder or file, like "explain this file ./package.json"
	- multi-agent mode allows user to activate agents system with strategy defined by 'multiAgents' in .hanabi.json

	Here are the list of handlers user can use

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
			const envVal = process.env[lookUp];
			if (!envVal) {
				console.log(
					Chalk.yellow(`System prompt file: missing env "${lookUp}"`),
				);
			} else {
				if (envVal.startsWith('file://')) {
					const fileContent = fs.readFileSync(
						resolve(process.cwd(), envVal.replace('file://', '')),
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
