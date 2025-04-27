interface CommonLLM {
	id: string;
	provider: 'OpenAI' | 'Google' | 'Deepseek';
	apiKey: string;
	apiUrl?: string;
	apiVersion?: string;
}

interface AzureLLM {
	id: string;
	provider: 'Azure';
	apiKey: string;
	apiVersion: string;
	apiUrl: string;
}

interface OllamaLLM {
	id: string;
	provider: 'Ollama';
	apiKey?: string;
	apiUrl?: string;
	apiVersion?: string;
}

interface OpenAICompatibleLLM {
	id: string;
	provider: 'OpenAI-Compatible';
	apiKey?: string;
	apiUrl: string;
	apiVersion?: string;
}

interface StdioMCPConfig {
    name: string;
    transport: 'stdio';
    /** node, npx etc */
    command: string,
	args: string[],
    version?: string;
	/** in milliseconds */
	timeout?: number;
}

interface RemoteMCPConfig {
    name: string;
    transport: 'sse' | 'streamable-http';
    url: string;
	headers?: Record<string, string>;
    version?: string;
	/** in milliseconds */
	timeout?: number;
}

type MCPServerConfig = StdioMCPConfig | RemoteMCPConfig;

type LLM = CommonLLM | AzureLLM | OllamaLLM | OpenAICompatibleLLM;

type HanabiConfig = {
    llms: LLM[];
    
    defaultModel?: {
        model: string;
        provider: LLM['provider'];
    };

	mcpServers?: {
		[key: string]: MCPServerConfig;
	};
};
