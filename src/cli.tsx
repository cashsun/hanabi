#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import App from './app.js';

const cli = meow(
	`
	Usage:
	  
		$ hanabi 		start hanabi cli chat
		$ hanabi list		list available LLMs and MCP servers 
		$ hanabi reset		reset hanabi config
		$ hanabi ask		single question mode

	Flags:
	  
		$ -q "question" 	prompt for single question mode

	Examples
		$ hanabi

		⟡ Hanabi will now start the initial setup.
`,
	{
		importMeta: import.meta,
		flags: {
			q: {
				type: 'string',
			},
		},
	},
);

// Create a client
const queryClient = new QueryClient();

render(
  <QueryClientProvider client={queryClient}>
	<App command={cli.input.at(0)} query={cli.flags.q}/>
  </QueryClientProvider>
);

