type CommonLLM = {
	id: string;
	provider: 'OpenAI' | 'Google' | 'Deepseek' | 'Anthropic' | 'Groq' | 'xAI';
	apiKey: string;
	apiUrl?: string;
	apiVersion?: string;
};

type AzureLLM = {
	id: string;
	provider: 'Azure';
	apiKey: string;
	apiVersion: string;
	apiUrl: string;
};

type OllamaLLM = {
	id: string;
	provider: 'Ollama';
	apiKey?: string;
	apiUrl?: string;
	apiVersion?: string;
};

type OpenAICompatibleLLM = {
	id: string;
	provider: 'OpenAI-Compatible';
	apiKey?: string;
	apiUrl: string;
	apiVersion?: string;
};

type StdioMCPConfig = {
	name: string;
	transport: 'stdio';
	/** Use node, npx etc */
	command: string;
	args: string[];
	version?: string;
	env?: Record<string, string>;
	/** default to current working directory */
	cwd?: string;
};

type RemoteMCPConfig = {
	name: string;
	transport: 'sse' | 'streamable-http';
	url: string;
	headers?: Record<string, string>;
	version?: string;
};

type MCPServerConfig = StdioMCPConfig | RemoteMCPConfig;

type LLM = CommonLLM | AzureLLM | OllamaLLM | OpenAICompatibleLLM;

type ServerConfig = {
	/** default 3041 */
	port?: number;
	/** this maps to `mcpServers` config */
	mcpKeys?: string[];
	/** name of the chat bot */
	name?: string;
};

type RoutingStrategy = {
	/** classify user request and route to target worker agent */
	strategy: 'routing';
	/** when not forced, the current agent will try to answer queries with no classification by itself */
	force?: boolean;
	agents: Array<{
		/** e.g. chat API endpoint another of remote hanabi agent http://localhost:3052/api */
		apiUrl: string;
		/** simple text describing what this agent does, e.g. "math problem" */
		classification: string;
		/** short agent name / key */
		name: string;
	}>;
};

type WorkflowStrategy = {
	/** generate output from starter worker agent and pass down to subsequant agents */
	strategy: 'workflow';
	/** sequence of workflow agent */
	steps: Array<{
		/** e.g. chat API endpoint another of remote hanabi agent http://localhost:3052/api */
		apiUrl: string;
		/** short agent name / key */
		name: string;
	}>;
};

type MultiAgentsStrategy = RoutingStrategy | WorkflowStrategy;

type HanabiConfig = {
	/**
	 * list of provider config
	 * see https://ai-sdk.dev/providers/ai-sdk-providers to learn how to hide api keys from this file via env variable
	 * */
	llms: LLM[];
	/** max LLM call for each prompt. default 10 */
	maxSteps?: number;
	defaultModel?: {
		model: string;
		provider: LLM['provider'];
	};
	/** JSON schema to enforce final answer output in a structured format,
	 * e.g.
	 * ```json
	 * 		{
	 * 			"type": "object",
	 * 			"properties": {
	 * 				"reason": {
	 * 					"type": "string",
	 * 					"description": "detailed reasoning for the final output."
	 * 				},
	 * 				"output": {
	 * 					"type": "number",
	 * 					"description": "the final output for the answer."
	 * 				}
	 * 			}
	 * 		}
	 *```
	 * for more details:
	 * - https://ai-sdk.dev/docs/reference/ai-sdk-core/json-schema
	 * - https://v4.zod.dev/json-schema#metadata
	 */
	answerSchema?: any;
	mcpServers?: Record<string, MCPServerConfig>;
	/** glob file/folder patterns to ignore with \@file handle */
	exclude?: string[];
	/** weather or not to use streaming mode for cli chat */
	streaming?: boolean;
	/**
	 * global process.env that will also be made available for MCP servers.
	 * Alternatively, use a `.env` file to hide secrets from your `.hanabi.json`
	 */
	envs?: Record<string, string | number>;
	/**
	 * Web Chat UI + API server config
	 */
	serve?: ServerConfig;
	/**
	 * mutli-agent system config
	 * - find more at https://ai-sdk.dev/docs/foundations/agents#patterns
	 */
	multiAgents?: MultiAgentsStrategy;
};
