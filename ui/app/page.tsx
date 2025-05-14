'use client';
import ChatUI from '@/components/chat/ChatUI';
import {useChatConfig} from '@/hooks/useChatConfig';
import {Sparkles} from 'lucide-react';

export default function Home() {
	const {data: config, isLoading: isLoadingConfig} = useChatConfig();
	if (isLoadingConfig) {
		return (
			<main className="justify-center h-screen w-full items-center flex bg-background text-primary/60">
				<Sparkles className="w-4 animate-pulse mr-2" /> checking config...
			</main>
		);
	}

	if(config?.apiOnly){
		return <main className="justify-center h-screen w-full items-center flex bg-background text-primary/60">
			<Sparkles className="w-4 mr-2" /> Chat UI is disabled by admin.
		</main>;
	}

	return <ChatUI />;
}
