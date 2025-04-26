interface CommonLLM {
    id: string; 
    provider: 'OpenAI' | 'Google' | 'Deepseek'
    apiKey: string;
    apiUrl?: string;
    apiVersion?: string;
}

interface AzureLLM {
    id: string; 
    provider: 'Azure'
    apiKey: string;
    apiVersion: string;
    apiUrl: string;
}

interface OllamaLLM {
    id: string; 
    provider: 'Ollama'
    apiKey?: string;
    apiUrl?: string;
    apiVersion?: string;
}

interface OpenAICompatibleLLM {
    id: string; 
    provider: 'OpenAI-Compatible'
    apiKey?: string;
    apiUrl: string;
    apiVersion?: string;
}

type LLM = CommonLLM | AzureLLM | OllamaLLM | OpenAICompatibleLLM;

type HanabiConfig = {
    defaultModel?: {
        id: string;
        model: string;
        provider: LLM['provider']
    };
    llms: LLM[]
}