interface LLM {
    id: string; 
    provider: 'OpenAI' | 'Google' | 'Azure' | 'Deepseek' | 'Ollama' | 'OpenAI-Compatible';
    models?: string[];
    apiKey: string;
    apiUrl?: string;
    apiVersion?: string;
    /** for azure api */
    resourceName?: string;
}

type HanabiConfig = {
    defaultModel?: {
        id: string;
        model: string;
    };
    llms: LLM[]
}