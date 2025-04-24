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
		$ hanabi config		change hanabi config, e.g. add an LLM
		$ hanabi ask		single question mode

	Options
		--name  Your name

	Examples
		$ hanabi --name=James
		Hello, James
`,
	{
		importMeta: import.meta,
		flags: {
			name: {
				type: 'string',
			},
		},
	},
);

// Create a client
const queryClient = new QueryClient();

render(
  <QueryClientProvider client={queryClient}>
	<App command={cli.input.at(0)}/>
  </QueryClientProvider>
);

