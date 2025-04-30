import type {CoreSystemMessage} from 'ai';
import {chatHandles, descriptions} from '../components/chat/ChatHandles.js';

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
	when user ask for help on how to use the terminal interface (e.g. when user says "/help")
	show the following help documenation
	
	
	Here are the list of commands and tools you can use

	${Object.entries(descriptions)
		.map(([key, desp]) => {
			return `${chatHandles[key as keyof typeof chatHandles]}\t${desp}`;
		})
		.join('\n\n')} 

	
	
	`,
});

export const getSystemMessages = (
	config: HanabiConfig,
): CoreSystemMessage[] => {
	const messages: CoreSystemMessage[] = [getDefaultSystemMessage()];

	if (config.systemPrompt) {
		messages.push({
			role: 'system',
			content: config.systemPrompt,
		});
	}

	return messages;
};
