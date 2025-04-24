import { useQuery } from "@tanstack/react-query";
import { CoreMessage, generateText, LanguageModelV1 } from "ai";
import { last } from 'lodash-es';

export const useChat = (model: LanguageModelV1, messages: CoreMessage[]) => {
    return useQuery({
        queryKey: ['use-chat', model, messages],
        enabled: !!messages.length,
        queryFn: async () => {
            if(last(messages)?.role === 'assistant'){
                return '';
            }
            const {text} = await generateText({
                model,
                messages,
            });
            
            return text;
        }
    })

}