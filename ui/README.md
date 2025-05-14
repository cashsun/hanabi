# Web chat UI + API service

This is the web chat UI + server (Next.js) when you run `hanabi serve` or `/serve` handle in the cli chat.

## APIs

### POST /api/chat

chat to current agent and stream full messages back.

```
payload:
{
    "messages": [
        {
            "role": "user",
            "content": "hi",
            "parts": [
                {
                    "type": "text",
                    "text": "hi"
                }
            ]
        }
    ],
}
```

### POST /api/generate

generate answer as json output. Use either `prompt` **or** `messages` as input
- **please see `answerSchema` config to learn how to generate structured output**
- multiAgents mode is not activated for this end point.

```
payload:
{
    "prompt"?: string;
    // https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat#messages mainly used when being a worker agent.
    "messages"?: UIMessage[] 
}
```

### GET /api/config

get server config - model, MCP servers in use and answer schema etc.
