import {Sparkles} from 'lucide-react';

export function MessageSkeleton() {
	return (
		<div className="rounded-lg flex -mt-4 leading-9 gap-4">
			<Sparkles className="w-5 flex-none" />
			<div className="grow h-16 animate-pulse bg-primary/15 rounded-lg" />
		</div>
	);
}
