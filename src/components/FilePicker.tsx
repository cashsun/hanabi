import {MultiSelect, Select, TextInput} from '@inkjs/ui';
import {Box, Newline, Text, useInput} from 'ink';
import React, {FC, useCallback, useMemo, useRef, useState} from 'react';
import fs from 'fs';
import path from 'path';
import {without} from 'lodash-es';

function listAllFilesSync(directory: string) {
	/**
	 * Lists all files in a directory and its subdirectories synchronously,
	 * returning a list of absolute paths.
	 *
	 * @param {string} directory The path to the directory to search.
	 * @returns {string[]} A list of strings, where each string is the absolute path to a file.
	 *                     Returns an empty array if the directory does not exist or is not a directory.
	 */

	try {
		const stats = fs.statSync(directory);
		if (!stats.isDirectory()) {
			console.error(`Error: '${directory}' is not a valid directory.`);
			return [];
		}
	} catch (err: any) {
		console.error(
			`Error: Directory '${directory}' does not exist: ${err.message}`,
		);
		return [];
	}
	// TODO: folder related config
	if (/(node_modules|dist|build|.git|.vscode|.yarn)/.test(directory)) {
		return [];
	}

	const filePaths: string[] = [];
	const files = fs.readdirSync(directory);

	for (const file of files) {
		const filePath = path.join(directory, file);
		const fileStats = fs.statSync(filePath);

		if (fileStats.isFile() && !/(.DS_Store|.env)/.test(file)) {
			filePaths.push(path.resolve(filePath)); // Get absolute path
		} else if (fileStats.isDirectory()) {
			// Recursive call directly within the loop
			filePaths.push(...listAllFilesSync(filePath));
		}
	}

	return filePaths;
}

export const FilePicker: FC<{
	multi?: boolean;
	onConfirm: (files: string[]) => void;
}> = ({multi, onConfirm}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [showInput, setShowInput] = useState(true);
	const [warning, setWarning] = useState('');
	const selected = useRef<string[]>([]);
	const allFiles = useMemo(() => {
		return listAllFilesSync(process.cwd());
	}, []);

	const refreshInput = useCallback(() => {
		setShowInput(false);
		setTimeout(() => setShowInput(true), 0);
	}, []);

	useInput((t, key) => {
    if(warning && !key.return){
      setWarning('');
    }
		if (key.escape) {
			onConfirm([]);
		}
	});

	const options = useMemo(() => {
		let filtered = allFiles;
		if (searchTerm) {
			const regex = new RegExp(searchTerm, 'ig');
			filtered = selected.current.concat(allFiles.filter(f => regex.test(f) && !selected.current.includes(f)));
		}
		return filtered.map(f => ({label: f, value: f}));
	}, [allFiles, searchTerm]);

	return (
		<Box
			borderColor="blueBright"
			borderStyle="single"
			flexDirection="column"
			paddingX={1}
		>
      {warning && <Text color="yellow">{warning}</Text>}
			<Box minHeight={1}>
				<Text color="blueBright" bold>
					File {'>'}{' '}
				</Text>
				{showInput && (
					<TextInput
						defaultValue={searchTerm}
						placeholder="Search... [SPACE] select, [ENTER] submit"
						onChange={val => {
							setSearchTerm(val.replace(/\s/g, ''));
							if (/\s/g.test(val)) {
								refreshInput();
							}
						}}
					/>
				)}
			</Box>
			{multi && (
				<MultiSelect
					visibleOptionCount={10}
					defaultValue={selected.current}
					options={options}
					onChange={vals => {
						selected.current = vals;
					}}
					onSubmit={() => {
            if(!selected.current.length){
              setWarning('No file selected. Use [ESC] to exit.')
            }else{
              onConfirm(selected.current)
            }
          }}
				/>
			)}
			{!multi && (
				<Select
					visibleOptionCount={10}
					options={options}
					onChange={val => onConfirm([val])}
				/>
			)}
		</Box>
	);
};
