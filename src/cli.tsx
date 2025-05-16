#!/usr/bin/env node
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Chalk from 'chalk';
import clipboardy from 'clipboardy';
import {Newline, render, Text} from 'ink';
import repl from 'node:repl';
import React, {type ReactNode} from 'react';
import {Chat} from './components/chat/Chat.js';
import {chatHandles, suggestions} from './components/chat/ChatHandles.js';
import {DefaultModelPicker} from './components/config/DefaultModelPicker.js';
import ListLLMAndMcpServers from './components/config/ListLLMAndMcpServers.js';
import {Setup} from './components/config/Setup.js';
import {
	getConfig,
	hasConfig,
	loadConfigToEnv,
	updateConfig,
} from './components/config/util.js';
import {resetMessages, useAppStore} from './store/appState.js';

import {spawn} from 'node:child_process';
import fs from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';
import {ReadStream} from 'node:tty';
import {cli} from './cli-init.js';
import {FilePicker} from './components/FilePicker.js';
import {McpPicker} from './components/McpPicker.js';
import {TemplateGenerater} from './components/config/TemplateGenerater.js';
import {getMcpTools} from './hooks/useMcpTools.js';

const queryClient = new QueryClient();

/**
 * list file paths based on starting pattern.
 * this is for cli file path auto completer.
 *
 * example 1: listFile('./') => ['./ui/', './app/', './README.md']
 * example 2: listFile('./ui/') => ['./ui/a.json', './ui/b.pdf']
 * example 3: listFile('./ui/a') => ['./ui/a.json']
 * example 4: listFile('./ui/a.j') => ['./ui/a.json']
 * example 4: listFile('./ui/a.json') => []
 *
 * @param start starting pattern
 */
function listFiles(start: string): string[] {
	// Handle empty input
	if (!start) {
		return [];
	}

	try {
		// Split the path into directory and partial filename
		const dirPath = dirname(start);
		const partialFile = basename(start);

		// If the start path ends with '/', then we're looking at a directory
		const isDirectory = start.endsWith('/') || start.endsWith('\\');
		const searchDir = isDirectory ? start : dirPath;

		// Normalize the search directory path
		const normalizedSearchDir = searchDir === '.' ? './' : searchDir;

		// Read the directory contents
		const files = fs.readdirSync(normalizedSearchDir, {withFileTypes: true});

		// Filter and format the results
		return files
			.filter(file => {
				// If we're looking at a directory (ends with /), show all contents
				if (isDirectory) {
					return true;
				}

				// Otherwise, filter by the partial filename
				return (
					file.name.toLowerCase().startsWith(partialFile.toLowerCase()) &&
					file.name !== partialFile
				);
			})
			.map(file => {
				// Format the path correctly
				const relativePath = join(normalizedSearchDir, file.name).replace(
					/\\/g,
					'/',
				);

				// Add trailing slash for directories
				return file.isDirectory() ? `./${relativePath}/` : `./${relativePath}`;
			});
	} catch {
		return [];
	}
}

async function showModelAndContext(context: Record<string, any>) {
	const config = getConfig();
	const defaultModel = config.defaultModel?.model;
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
		await getMcpTools(context['mcpKeys']);
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
	if (context['schema']) {
		render(
			<Text color="gray">
				@answerSchema
				{config.answerSchema ? (
					<Text color="green"> ✓</Text>
				) : (
					<Text color="yellow"> "answerSchema" missing in .hanabi.json</Text>
				)}
			</Text>,
		).unmount();
	}
	if (context['agents']) {
		render(
			<Text color="gray">
				@multiAgents
				{config.multiAgents ? (
					<Text color="green"> ✓</Text>
				) : (
					<Text color="yellow"> "multiAgents" missing in .hanabi.json</Text>
				)}
			</Text>,
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
				stdin.destroy();
				instance.unmount();
				process.stdin.resume();
			})}
		</QueryClientProvider>,
		// prevent ink from exiting process when input is used
		{stdin},
	);

	await instance.waitUntilExit();
	process.stdin.resume();
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

function startServer() {
	const prod = !cli.flags.dev;
	const config = getConfig();
	const ls = spawn(
		'node',
		[
			'../node_modules/next/dist/bin/next',
			prod ? 'start' : 'dev',
			'-p',
			`${config.serve?.port ?? 3041}`,
		],
		{
			cwd: resolve(dirname(import.meta.dirname), prod ? './dist' : './ui'),
			shell: true,
		},
	);
	ls.stderr.on('data', d => console.error(`${d}`));
	ls.stdout.on('data', d => console.info(`${d}`));
	ls.on('error', d => console.error('Exception:', `${d}`));
	ls.on('exit', d => console.log(`Child process exited: ${d}`));
}

function startChat() {
	function completer(line: string) {
		const hits = suggestions.filter(c => c.startsWith(line));
		if (!hits.length) {
			const startPath = line.slice(line.indexOf('./'));
			const filePaths = listFiles(startPath);
			return [filePaths, filePaths.length ? startPath : line];
		}
		return [hits.length === 1 && hits[0] === line ? [] : hits, line];
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
				case chatHandles.GEN: {
					await renderAndComplete(onComplete => (
						<TemplateGenerater onComplete={onComplete} />
					));
					break;
				}
				case chatHandles.SERVE: {
					updateConfig({
						serve: {
							port: getConfig().serve?.port,
							mcpKeys: context['mcpKeys'] ?? [],
						},
					});
					startServer();
					return;
				}
				case chatHandles.CLEAR: {
					context['mcpKeys'] = [];
					context['files'] = [];
					context['isWithClip'] = false;
					context['schema'] = false;
					context['agents'] = false;
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
				case chatHandles.SCHEMA: {
					context['schema'] = true;
					break;
				}
				case chatHandles.AGENTS: {
					context['agents'] = true;
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
							onComplete={() => {
								context['isWithClip'] = false;
								onComplete();
							}}
							files={context['files']}
							isWithClip={context['isWithClip']}
							isWithAnswerSchema={context['schema']}
							isMultiAgentsMode={context['agents']}
							mcpKeys={context['mcpKeys']}
						/>
					));
					break;
				}
			}
		}
		await showModelAndContext(context);
		cb(null, undefined);
	}

	render(
		<Text>
			<Text color="gray">⟡ Hint: ask AI how to use this tool.</Text>
		</Text>,
		// unmount to free the cursor
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
		case 'gen': {
			await renderAndComplete(complete => (
				<TemplateGenerater onComplete={complete} />
			));
			process.exit(0);
			break;
		}
		case 'serve': {
			startServer();
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
				render(
					<QueryClientProvider client={queryClient}>
						<Chat
							isSingleRunQuery
							isWithAnswerSchema
							prompt={cli.input.slice(1).join(' ')}
							onComplete={() => {}}
						/>
					</QueryClientProvider>,
				);
			}

			break;
		}
		case 'llm': {
			await renderAndComplete(onComplete => (
				<DefaultModelPicker onSelect={onComplete} />
			));
			process.exit(0);
			break;
		}
		case 'reset': {
			await renderAndComplete(() => <Setup isReset />);
			process.exit(0);
			break;
		}
		default: {
			startChat();
		}
	}
}
