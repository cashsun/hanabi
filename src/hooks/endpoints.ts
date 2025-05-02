const OPENAI_API_URL = 'https://api.openai.com/v1';
const GOOGLE_AI_API_URL =
	'https://generativelanguage.googleapis.com/v1beta/openai';
const DEEPSEEK_API_URL = 'https://api.deepseek.com';
const OLLAMA_API_URL = 'http://localhost:11434/api';
const GROQ_API_URL = 'https://api.groq.com/openai/v1';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1';
const XAI_API_URL = 'https://api.x.ai/v1';

export const officialApiUrls: Record<LLM['provider'], string> = {
	Google: GOOGLE_AI_API_URL,
	Anthropic: ANTHROPIC_API_URL,
	Azure: '',
	Deepseek: DEEPSEEK_API_URL,
	OpenAI: OPENAI_API_URL,
	Ollama: OLLAMA_API_URL,
	Groq: GROQ_API_URL,
	'OpenAI-Compatible': '',
	xAI: XAI_API_URL,
};
