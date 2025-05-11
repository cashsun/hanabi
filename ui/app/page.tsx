'use client';
import ChatUI from '@/components/chat/ChatUI';
import { useChatConfig } from '@/hooks/useChatConfig';
import {
	Sparkles
} from 'lucide-react';


export default function Home() {
	const {data: config, isLoading: isLoadingConfig} = useChatConfig();

	if (isLoadingConfig) {
		return (
			<main className="h-screen container mx-auto flex items-center justify-center">
				<Sparkles className="mr-2 w-4 animate-pulse" /> Checking agent config...
			</main>
		);
	}

	return <ChatUI />;
}
