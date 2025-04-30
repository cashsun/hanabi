#!/usr/bin/env node
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Chalk from 'chalk';
import clipboardy from 'clipboardy';
import {Newline, render, Text} from 'ink';
import meow from 'meow';
import repl from 'node:repl';
import React, {type ReactNode} from 'react';
import App from './app.js';
import {Chat} from './components/chat/Chat.js';
import {chatHandles, suggestions} from './components/chat/ChatHandles.js';
import {DefaultModelPicker} from './components/config/DefaultModelPicker.js';
import ListLLMAndMcpServers from './components/config/ListLLMAndMcpServers.js';
import {Setup} from './components/config/Setup.js';
import {
	getConfig,
	hasConfig,
	loadConfigToEnv,
} from './components/config/util.js';
import {resetMessages, useAppStore} from './store/appState.js';

import {ReadStream} from 'node:tty';
import {FilePicker} from './components/FilePicker.js';
import {McpPicker} from './components/McpPicker.js';

const queryClient = new QueryClient();

const cli = meow(
	`
	Usage:
	
		$ hanabi 			start hanabi cli chat
		$ hanabi llm			update provider and model
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
			q: {
				type: 'string',
			},
		},
	},
);

function showModelAndContext(context: Record<string, any>) {
	const defaultModel = getConfig().defaultModel?.model;
	if (defaultModel) {
		render(
			<Text>
				<Newline />
				<Text color="gray">⟡ {getConfig().defaultModel?.model}</Text>
			</Text>,
		).unmount();
	}
	if (context['isWithClip']) {
		render(
			<Text color="gray">
				@clipboard
				<Text color="green"> ✓</Text>
			</Text>,
		).unmount();
	}
	if (context['mcpKeys']?.length) {
		render(
			<>
				{context['mcpKeys'].map((mcpKey: string) => (
					<Text color="gray" key={mcpKey}>
						{`@mcp: ${mcpKey}`}
						<Text color="green"> ✓</Text>
					</Text>
				))}
			</>,
		).unmount();
	}
	if (context['files']?.length) {
		render(
			<>
				{context['files'].map((file: string) => (
					<Text color="gray" key={file}>
						{`@file: ${file}`}
						<Text color="green"> ✓</Text>
					</Text>
				))}
			</>,
		).unmount();
	}
}

class InkStdin extends ReadStream {
	override isTTY = true;
}

async function renderAndComplete(cb: (onComplete: () => void) => ReactNode) {
	process.stdin.pause();
	const stdin = new InkStdin(0) as unknown as ReadStream;
	const instance = render(
		<QueryClientProvider client={queryClient}>
			{cb(() => {
				process.stdin.resume();
				stdin.destroy();
				instance.unmount();
			})}
		</QueryClientProvider>,
		// prevent ink from exiting process when input is used
		{stdin},
	);

	await instance.waitUntilExit();
}

function copyLastMessageToClipboard() {
	const lastMessage = useAppStore.getState().messages.at(-1);
	if (!lastMessage) {
		render(<Text color="gray">⟡ No message found.</Text>).unmount();
		return;
	}

	if (Array.isArray(lastMessage.content)) {
		clipboardy.writeSync(
			lastMessage.content.find(c => c.type === 'text')?.text ?? '',
		);
	} else {
		clipboardy.writeSync(lastMessage.content);
	}
	render(
		<>
			<Text color="magenta">⟡ Copied to clipboard!</Text>
			<Newline />
		</>,
	).unmount();
}

function startChat() {
	// const context: Record<string, any> = {};

	function completer(line: string) {
		const hits = suggestions.filter(c => c.startsWith(line));
		// Show all completions if none found
		return [hits.length ? hits : suggestions, line];
	}

	async function myEval(
		input: string,
		context: Record<string, any>,
		f: string,
		cb: (err: any, result: any) => void,
	) {
		if (context['mode']) {
			cb(null, undefined);
			return;
		}

		const prompt = input.trim();

		if (prompt) {
			switch (prompt) {
				case chatHandles.EXIT: {
					replServer.close();
					process.exit(0);
					return;
				}
				case chatHandles.RESET: {
					resetMessages();
					console.clear();
					break;
				}
				case chatHandles.COPY: {
					copyLastMessageToClipboard();
					break;
				}
				case chatHandles.CLEAR: {
					context['mcpKeys'] = [];
					context['files'] = [];
					context['isWithClip'] = false;
					break;
				}
				case chatHandles.MCP: {
					context['mode'] = chatHandles.MCP;
					await renderAndComplete(onComplete => (
						<McpPicker
							mcpKeys={context['mcpKeys']}
							onSelect={mcpKeys => {
								context['mode'] = undefined;
								context['mcpKeys'] = mcpKeys;
								onComplete();
							}}
						/>
					));
					break;
				}
				case chatHandles.CLIP: {
					context['isWithClip'] = true;
					break;
				}
				case chatHandles.FILE: {
					context['mode'] = chatHandles.FILE;
					await renderAndComplete(onComplete => (
						<FilePicker
							multi
							files={context['files']}
							onConfirm={files => {
								context['mode'] = undefined;
								context['files'] = files;
								onComplete();
							}}
						/>
					));
					break;
				}
				case chatHandles.LLM: {
					context['mode'] = chatHandles.LLM;
					await renderAndComplete(onComplete => (
						<DefaultModelPicker
							onSelect={() => {
								context['mode'] = undefined;
								resetMessages();
								onComplete();
							}}
						/>
					));
					break;
				}
				default: {
					await renderAndComplete(onComplete => (
						<Chat
							prompt={prompt}
							onComplete={onComplete}
							files={context['files']}
							isWithClip={context['isWithClip']}
							mcpKeys={context['mcpKeys']}
						/>
					));
					break;
				}
			}
		}
		showModelAndContext(context);
		cb(null, undefined);
	}

	console.clear();
	render(
		<Text>
			<Text color="gray">⟡ Hint: ask AI how to use this tool.</Text>
		</Text>,
	).unmount();
	showModelAndContext({});

	const replServer = repl.start({
		prompt: Chalk.magenta('Chat > '),
		eval: myEval,
		completer,
		ignoreUndefined: true,
	});
}

if (!hasConfig()) {
	render(
		<QueryClientProvider client={queryClient}>
			<Setup isReset={false} />
		</QueryClientProvider>,
	);
} else {
	loadConfigToEnv();
	switch (cli.input.at(0)) {
		case 'list': {
			render(<ListLLMAndMcpServers />);
			break;
		}
		case 'ask': {
			if (!cli.input.at(1)) {
				render(
					<Text color="yellow">
						Hmm, you didn't ask any question. Try:
						<Newline />
						<Text color="gray">hanabi ask "what's the date today?"</Text>
					</Text>,
				);
			} else {
				await renderAndComplete(onComplete => (
					<Chat
						isSingleRunQuery
						prompt={cli.input.at(1) ?? ''}
						onComplete={onComplete}
					/>
				));
			}

			break;
		}
		case 'ui': {
			render(
				<QueryClientProvider client={queryClient}>
					<App />
				</QueryClientProvider>,
			);

			break;
		}
		case 'llm': {
			await renderAndComplete(onComplete => (
				<DefaultModelPicker onSelect={onComplete} />
			));

			break;
		}
		case 'reset': {
			render(
				<QueryClientProvider client={queryClient}>
					<Setup isReset />
				</QueryClientProvider>,
			);
			break;
		}
		default: {
			startChat();
		}
	}
}
