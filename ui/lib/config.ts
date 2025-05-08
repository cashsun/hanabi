import {populate, config} from 'dotenv';
import fs from 'fs';
import {merge, unionBy} from 'lodash-es';
import os from 'os';
import {resolve} from 'path';
import {anthropic} from '@ai-sdk/anthropic';
import {createAzure} from '@ai-sdk/azure';
import {deepseek} from '@ai-sdk/deepseek';
import {google} from '@ai-sdk/google';
import {groq} from '@ai-sdk/groq';
import {openai} from '@ai-sdk/openai';
import {createOpenAICompatible} from '@ai-sdk/openai-compatible';
import {xai} from '@ai-sdk/xai';
import {ollama} from 'ollama-ai-provider';

// load .env files on start
config({path: process.env['HANABI_PWD']});

function getResourceNameFromUrl(urlString: string) {
	try {
		// 1. Create a URL object from the string.
		// This object provides methods to easily access parts of the URL.
		const url = new URL(urlString);

		// 2. Get the hostname property.
		// For 'https://your-resource-name.openai.azure.com/openai',
		// url.hostname will be 'your-resource-name.openai.azure.com'.
		const hostname = url.hostname; // e.g., "your-resource-name.openai.azure.com"

		// 3. Split the hostname by the dot ('.') character.
		// This creates an array of the hostname parts.
		const parts = hostname.split('.'); // e.g., ["your-resource-name", "openai", "azure", "com"]

		// 4. The resource name is the first element of the array.
		// Check if parts array is not empty before accessing the first element.
		if (parts.length > 0) {
			return parts[0]; // e.g., "your-resource-name"
		}
		// This case is unlikely if the URL constructor succeeded and hostname exists,
		// but it's good practice to handle it.
		console.warn('Could not split hostname into parts:', hostname);
		return null;
	} catch (error: unknown) {
		// Handle potential errors if the input string is not a valid URL.
		console.error('Invalid URL provided:', error);
		return null; // Indicate failure by returning null
	}
}

export const DEFAULT_AZURE_API_VERSION = '2025-01-01-preview';
export const DEFAULT_ANTHROPIC_API_VERSION = '2023-06-01';
export function getDefaultApiVersion(provider: LLM['provider'] | undefined) {
	switch (provider) {
		case 'Azure':
			return DEFAULT_AZURE_API_VERSION;
		case 'Anthropic':
			return DEFAULT_ANTHROPIC_API_VERSION;
		default:
			return '';
	}
}

export const defaultConfig: HanabiConfig = {
	llms: [],
	streaming: true,
	mcpServers: {
		'file-system': {
			name: 'file system',
			transport: 'stdio',
			command: 'npx',
			args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
		},
	},
	serve: {
		port: 3041,
	},
	envs: {
		HANABI_PRODUCT_NAME: 'My Dummy Product',
	},
};

const localConfigPath = resolve(
	process.env['HANABI_PWD'] ?? '/do/not/exist/',
	'.hanabi.json',
);
const userConfigPath = resolve(os.homedir(), '.hanabi.json');
export const configPath = fs.existsSync(localConfigPath)
	? localConfigPath
	: userConfigPath;

/**
 * merge the existing config with the provided config and write it to the config file.
 * @param config The config to merge write. If not provided, the default config will be used.
 */
export const writeConfig = (config: Partial<HanabiConfig>) => {
	fs.writeFileSync(
		configPath,
		JSON.stringify(merge({}, getConfig(), config), null, 2),
	);
};

export const hasConfig = () => fs.existsSync(configPath);

export const removeConfig = () => {
	if (hasConfig()) {
		fs.rmSync(configPath);
	}
};

export const getConfig = () => {
	if (!hasConfig()) {
		return defaultConfig;
	}
	if (configPath === localConfigPath) {
		const localConfig: Partial<HanabiConfig> = JSON.parse(
			fs.readFileSync(configPath, 'utf8'),
		);
		const userConfig: HanabiConfig | undefined = fs.existsSync(userConfigPath)
			? JSON.parse(fs.readFileSync(userConfigPath, 'utf8'))
			: undefined;

		const merged = merge({}, userConfig, localConfig) as HanabiConfig;
		merged.llms = unionBy(
			[...(localConfig.llms ?? []), ...(userConfig?.llms ?? [])],
			'provider',
		);
		return merged;
	}
	const config = fs.readFileSync(configPath, 'utf8');
	return JSON.parse(config) as HanabiConfig;
};

export const loadConfigToEnv = () => {
	if (!hasConfig()) {
		return;
	}
	const config = getConfig();
	const envs: any = config.envs ?? {};
	for (const llm of config.llms) {
		switch (llm.provider) {
			case 'OpenAI':
				envs.OPENAI_API_KEY = llm.apiKey;
				break;
			case 'Azure':
				envs.AZURE_API_KEY = llm.apiKey;
				envs.AZURE_API_VERSION = llm.apiVersion;
				envs.AZURE_RESOURCE_NAME = getResourceNameFromUrl(llm.apiUrl);
				break;
			case 'Google':
				envs.GOOGLE_GENERATIVE_AI_API_KEY = llm.apiKey;
				break;
			case 'Anthropic':
				envs.ANTHROPIC_API_KEY = llm.apiKey;
				break;
			case 'Deepseek':
				envs.DEEPSEEK_API_KEY = llm.apiKey;
				break;
			case 'Groq':
				envs.GROQ_API_KEY = llm.apiKey;
				break;
			case 'xAI':
				envs.XAI_API_KEY = llm.apiKey;
				break;
			default:
				break;
		}
	}
	populate(process.env as any, envs);
};

export const getModel = (defaultModel: HanabiConfig['defaultModel']) => {
	const config = getConfig();
	const llm = config.llms.find(l => l.provider === defaultModel?.provider);
	if (!llm || !defaultModel) {
		return undefined;
	}

	const modelName = defaultModel.model; // Extract model name for clarity

	switch (llm.provider) {
		case 'Google': {
			return google(modelName);
		}
		case 'Azure': {
			const azure = createAzure({
				apiVersion: llm.apiVersion ?? getDefaultApiVersion(llm.provider),
			});
			return azure(modelName);
		}
		case 'Deepseek':
			return deepseek(modelName);
		case 'Anthropic':
			return anthropic(modelName);
		case 'OpenAI':
			return openai(modelName);
		case 'Groq':
			return groq(modelName);
		case 'xAI':
			return xai(modelName);
		case 'Ollama':
			return ollama(modelName);
		default: {
			// OpenAI Compatible
			const compatible = createOpenAICompatible({
				name: llm.provider,
				apiKey: llm.apiKey,
				baseURL: llm.apiUrl ?? '',
			});
			return compatible(modelName);
		}
	}
};
