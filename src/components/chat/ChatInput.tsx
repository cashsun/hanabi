import {Spinner, TextInput, type TextInputProps} from '@inkjs/ui';
import type {TextPart, UserContent} from 'ai';
import clipboardy from 'clipboardy';
import dedent from 'dedent';
import fs from 'fs';
import {Box, Text, type TextProps, useInput} from 'ink';
import mime from 'mime-types';
import os from 'os';
import {resolve} from 'path';
import React, {type FC, useCallback, useMemo, useState} from 'react';
import {DefaultModelPicker} from '../config/DefaultModelPicker.js';
import {FilePicker} from '../FilePicker.js';
import {McpPicker} from '../McpPicker.js';
import {ChatHandles, chatHandles, suggestions} from './ChatHandles.js';

const wkdir = process.cwd();

const isReset = (msg?: string) => msg && chatHandles.RESET === msg.trim();
const isCopy = (msg?: string) => msg && chatHandles.COPY === msg.trim();
const isLLM = (msg?: string) => msg && chatHandles.LLM === msg.trim();
const isExit = (msg?: string) =>
	msg && new RegExp(`${chatHandles.EXIT}`, 'gi').test(msg.trim());

export function getFinalMsg(
	defaultModel: HanabiConfig['defaultModel'],
	msg: string,
	files: string[],
	isWithClip: boolean,
) {
	const clip = isWithClip ? clipboardy.readSync() : undefined;
	const clipText = clip ? `\n\n\`\`\`\n${clip}\n\`\`\`` : '';
	const finalMsg: UserContent = [{type: 'text', text: `${msg}${clipText}`}];
	if (files.length) {
		for (const f of files) {
			(finalMsg[0] as TextPart).text += `\n@file: ${f}`;
			const mimeType = mime.lookup(f) || 'text/plain';
			if (mimeType.startsWith('image')) {
				finalMsg.push({
					type: 'image',
					mimeType,
					image: fs.readFileSync(resolve(wkdir, f)),
				});
			} else {
				if (
					defaultModel?.provider === 'OpenAI' ||
					defaultModel?.provider === 'Azure' ||
					defaultModel?.provider === 'OpenAI-Compatible' ||
					(defaultModel?.provider === 'Anthropic' && !mimeType.endsWith('/pdf'))
				) {
					// OpenAI models does not support raw files yet via completion API
					// so we include the file content
					(finalMsg[0] as TextPart).text += dedent`\n
					\`\`\`
					\n${fs.readFileSync(f, {encoding: 'utf8'})}\n
					\`\`\`
					`;
				} else {
					finalMsg.push({
						type: 'file',
						mimeType: mimeType === 'application/json' ? 'text/plain' : mimeType,
						data: fs.readFileSync(resolve(wkdir, f)),
					});
				}
			}
		}
	}
	return finalMsg;
}

export const ChatInput: FC<{
	defaultModel: HanabiConfig['defaultModel'];
	isFetching?: boolean;
	onSubmit: (msg: UserContent, mcpKeys: string[]) => void;
	onReset?: () => void;
	onCopy?: () => void;
	onLLM?: () => void;
}> = ({defaultModel, isFetching, onSubmit, onReset, onCopy, onLLM}) => {
	const [value, setValue] = useState('');
	const [showInput, setShowInput] = useState(true);
	const [files, setFiles] = useState<string[]>([]);
	const [mcpKeys, setMcpKeys] = useState<string[]>([]);
	const [pickingLLM, setPickingLLM] = useState(false);
	const [clipboard, setClipboard] = useState(false);
	const pickingFile = new RegExp(`${chatHandles.FILE}$`).test(value ?? '');
	const pickingMCP = new RegExp(`${chatHandles.MCP}$`).test(value ?? '');
	const includingClipboard = new RegExp(`${chatHandles.CLIP}$`).test(
		value ?? '',
	);

	const activeParamHandles = useMemo(() => {
		const hdles: {type: string; label: string; color: TextProps['color']}[] =
			[];
		if (mcpKeys.length) {
			hdles.push({
				type: chatHandles.MCP,
				label: '@mcp',
				color: 'magentaBright',
			});
		}

		if (clipboard) {
			hdles.push({
				type: chatHandles.CLIP,
				label: `@clip`,
				color: 'cyan',
			});
		}

		if (files.length) {
			hdles.push({
				type: chatHandles.FILE,
				label: `@file(${files.length})`,
				color: 'yellow',
			});
		}

		return hdles;
	}, [files, mcpKeys, clipboard]);

	useInput((t, key) => {
		if (key.tab) {
			const found = suggestions.find(s => new RegExp(value).test(s));
			if (found) {
				setValue(found);
				refreshInput();
			}
		}
		if ((key.backspace || (key.delete && os.type() === 'Darwin')) && !value) {
			if (activeParamHandles.at(-1)) {
				switch (activeParamHandles.at(-1)?.type as keyof typeof chatHandles) {
					case chatHandles.FILE: {
						setFiles([]);
						break;
					}
					case chatHandles.MCP: {
						setMcpKeys([]);
						break;
					}
					case chatHandles.CLIP: {
						setClipboard(false);
						break;
					}
					default: {
						throw new Error(
							`Unhandled chat handle: ${activeParamHandles.at(-1)?.type}`,
						);
					}
				}
			}
		}
	});

	// input does not support controlled mode, we need to rerender to override
	// default value instead.
	const refreshInput = useCallback(() => {
		setShowInput(false);
		setTimeout(() => {
			setShowInput(true);
		}, 0);
	}, []);

	if (pickingFile) {
		return (
			<FilePicker
				multi
				files={files}
				onConfirm={files => {
					setFiles(files);
					setValue(prev =>
						prev.replace(new RegExp(`${chatHandles.FILE}$`), ``),
					);
				}}
			/>
		);
	}

	if (pickingMCP) {
		return (
			<McpPicker
				mcpKeys={mcpKeys}
				onSelect={mcps => {
					setMcpKeys(mcps);
					setValue(prev => prev.replace(new RegExp(`${chatHandles.MCP}$`), ``));
				}}
			/>
		);
	}

	if (includingClipboard) {
		setClipboard(true);
		setValue(prev => prev.replace(new RegExp(`${chatHandles.CLIP}$`), ``));
		refreshInput();
	}

	if (pickingLLM) {
		return (
			<DefaultModelPicker
				onSelect={() => {
					setPickingLLM(false);
					setFiles([]);
					onLLM?.();
				}}
			/>
		);
	}

	return (
		<Box flexDirection="column">
			<Box
				borderColor="blueBright"
				flexWrap="wrap"
				borderStyle="single"
				minHeight={1}
				paddingX={1}
			>
				<Box flexBasis="auto" flexShrink={0}>
					<Text color="blueBright" bold>
						Chat {'>'}{' '}
					</Text>
				</Box>
				{isFetching && <Spinner label="Thinking..." />}
				{!isFetching && (
					<Box flexBasis="auto" flexShrink={0}>
						{activeParamHandles.map(ah => (
							<Text key={ah.label} backgroundColor={ah.color}>
								{ah.label}
							</Text>
						))}
					</Box>
				)}

				{!isFetching && showInput && (
					<TextInput
						placeholder={` ${defaultModel?.model}`}
						onChange={setValue}
						suggestions={suggestions}
						defaultValue={value}
						onSubmit={msg => {
							if (!msg) {
								return;
							}
							if (isExit(msg)) {
								process.exit(0);
							}

							if (isReset(msg)) {
								onReset?.();
								setValue('');
								refreshInput();
								return;
							}
							if (isCopy(msg)) {
								onCopy?.();
								setValue('');
								refreshInput();
								return;
							}
							if (isLLM(msg)) {
								setPickingLLM(true);
								setValue('');
								setFiles([]);
								refreshInput();
								return;
							}

							setValue('');
							const finalMsg = getFinalMsg(defaultModel, msg, files, clipboard);
							setFiles([]);
							onSubmit?.(finalMsg, mcpKeys);
						}}
					/>
				)}
			</Box>
			<ChatHandles />
		</Box>
	);
};
