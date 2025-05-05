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
	mcpKeys?: string[];
	/** name of the chat bot */
	name?: string;
};

type HanabiConfig = {
	llms: LLM[];
	maxSteps?: number;
	defaultModel?: {
		model: string;
		provider: LLM['provider'];
	};

	mcpServers?: Record<string, MCPServerConfig>;
	/** glob file/folder patterns */
	exclude?: string[];
	/** weather or not to use streaming mode */
	streaming?: boolean;
	envs?: Record<string, string | number>;
	serve?: ServerConfig;
};
