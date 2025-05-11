# Web chat UI + API service

This is the web chat UI + server (Next.js) when you run `hanabi serve` or `/serve` handle in the cli chat.

## APIs

### POST /api/chat 
chat to current agent and stream full messages back.
```
payload:
{
    "id": string, // unique string id
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
generate answer as json output with current agent.
**please see `answerSchema` config to learn how to generate structured data**
```
payload:
{
    "prompt": string
}
```

### GET /api/config
get server config - model, MCP servers in use and answer schema etc. 