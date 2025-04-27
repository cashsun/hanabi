import {MultiSelect, Select, Spinner, TextInput} from '@inkjs/ui';
import {Box, Text, useInput} from 'ink';
import React, {FC, useMemo, useState} from 'react';
import {useModelList} from '../hooks/useListModels.js';
import {getConfig} from './config/util.js';

interface Props {
	onSelect: (mcpServerKeys: string[]) => void;
}

export const McpPicker: FC<Props> = ({onSelect}) => {
	const [warning, setWarning] = useState('');
	const options = useMemo(() => {
		const config = getConfig();
		return Object.entries(config.mcpServers ?? {}).map(([key, c]) => {
			return {
				label: c.name,
				value: key,
			};
		});
	}, []);

	useInput((t, key) => {
		if (warning && !key.return) {
			setWarning('');
		}
		if (key.escape) {
			onSelect([]);
		}
	});

	return (
		<Box flexDirection="column">
			<Text color="green">Pick Your MCP servers</Text>
			{warning && <Text color="yellow">{warning}</Text>}
			{!options.length && (
				<Text color="gray">
					No MCP server config found. Find instructions here:
					https://github.com/cashsun/hanabi?tab=readme-ov-file#mcp-servers
				</Text>
			)}
			{!!options.length && <MultiSelect
				options={options}
				visibleOptionCount={10}
				onChange={() => {}}
				onSubmit={keys => {
					if (!keys.length) {
						setWarning(
							'No server selected. Use [SPACE] to pick or [ESC] to exit.',
						);
					} else {
						onSelect(keys);
					}
				}}
			/>}
		</Box>
	);
};
