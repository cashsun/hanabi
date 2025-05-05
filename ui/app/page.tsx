import ChatUI from '@/components/chat/ChatUI';
import {getConfig} from '@/lib/config';

export default function Home() {
	const config = getConfig();
	return (
		<ChatUI config={{defaultModel: config.defaultModel, ...config.serve}} />
	);
}
