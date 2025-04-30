import type {CoreMessage} from 'ai';
import {create} from 'zustand';
import {getConfig, hasConfig} from '../components/config/util.js';
import {getSystemMessages} from '../prompts/systemPrompts.js';

interface AppState {
	ready: boolean;
	messages: CoreMessage[];
}

export const useAppStore = create<AppState>(set => ({
	ready: hasConfig(),
	messages: getSystemMessages(getConfig()),
}));

export const setAppReady = (ready: boolean) => {
	useAppStore.setState({ready: true});
};

export const addMessages = (messages: CoreMessage[]) => {
	useAppStore.setState(state => ({messages: [...state.messages, ...messages]}));
};

export const resetMessages = () => {
	useAppStore.setState({messages: getSystemMessages(getConfig())});
};
