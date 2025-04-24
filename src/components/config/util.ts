import {resolve} from 'path';
import os from 'os';
import fs from 'fs';
import {populate} from 'dotenv';
import {merge} from 'lodash-es';

export const defaultConfig: HanabiConfig = {
	llms: [],
};

export const configPath = resolve(os.homedir(), '.hanabi.json');

/**
 * merge the existing config with the provided config and write it to the config file.
 * @param config The config to merge write. If not provided, the default config will be used.
 */
export const writeConfig = (config: HanabiConfig) => {
	fs.writeFileSync(
		configPath,
		JSON.stringify(merge({}, getConfig(), config), null, 2),
	);
};

export const hasConfig = () => fs.existsSync(configPath);

export const getConfig = () => {
	if (!hasConfig()) {
		return defaultConfig;
	}
	const config = fs.readFileSync(configPath, 'utf-8');
	return JSON.parse(config) as HanabiConfig;
};

export const loadConfigToEnv = () => {
	if (!hasConfig()) {
		return;
	}
	const config = getConfig();
	const apiKeys = {};
	for (const llm of config.llms) {
		switch (llm.provider) {
			case 'OpenAI':
				apiKeys['OPENAI_API_KEY'] = llm.apiKey;
				break;
			case 'Azure':
				apiKeys['AZURE_API_KEY'] = llm.apiKey;
				break;
			case 'Google':
				apiKeys['GOOGLE_GENERATIVE_AI_API_KEY'] = llm.apiKey;
				break;
			case 'Deepseek':
				apiKeys['DEEPSEEK_API_KEY'] = llm.apiKey;
				break;
		}
	}
	populate(process.env, apiKeys);
};
