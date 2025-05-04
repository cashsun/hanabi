import meow from 'meow';

export const cli = meow(
	`
	Usage:
	
		$ hanabi 			start hanabi cli chat

		$ hanabi serve			start hanabi web server

		$ hanabi llm			update provider and model

		$ hanabi gen			generate Hanabi templates

		$ hanabi list			list available LLMs and MCP servers 

		$ hanabi reset			reset hanabi config
		

		$ hanabi ask "<question>"	single question mode
	
	Examples

		$ hanabi
		
		⟡ Hanabi will now start the initial setup.
	`,
	{
		importMeta: import.meta,
		flags: {
			prod: {
				type: 'boolean',
			},
		},
	},
);
