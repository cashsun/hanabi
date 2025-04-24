import { useQuery } from "@tanstack/react-query";
import { CoreMessage, generateText, LanguageModelV1 } from "ai";

export const useChat = (model: LanguageModelV1, messages: CoreMessage[]) => {
    return useQuery({
        queryKey: ['use-chat', model, messages],
        enabled: !!messages.length,
        queryFn: async () => {
            const {text} = await generateText({
                model,
                messages,
            });

            return text;
        }
    })

}