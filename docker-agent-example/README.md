## Docker setup for deployment
> this folder show case how to deploy your hanabi agent as a docker image.

- make sure all mcp severs are locally available e.g. via node_modules
- make sure .hanabi.json contains the llm provider setup (for default model) that's copied from your `homedir`/.hanabi.json
- make sure .hanabi.json contains `mcpServers` that's used in serve.mcpKeys
- you can save all secrets and tokens in local .env file
- see [Dockerfile](./Dockerfile) for more details

example `.hanabi.json`. 
```
{
  "llms": [
    {
      "id": "fdd1abc5-6791-4c29-b754-4f1174692c22",
      "provider": "OpenAI",
      "apiVersion": "2025-01-01-preview"
    }
  ],
  "streaming": true,
  "mcpServers": {
    "tavily-search": {
      "name": "Tavily Search",
      "transport": "stdio",
      "command": "node",
      "args": [
        "./node_modules/tavily-mcp/build/index.js"
      ]
    }
  },
  "defaultModel": {
    "id": "fdd1abc5-6791-4c29-b754-4f1174692c22",
    "model": "gpt-4.1-mini",
    "provider": "OpenAI"
  },
  "serve": {
    "port": 3041,
    "mcpKeys": ["tavily-search"]
  }
}
```

### build image
```bash
docker build --no-cache -t hanabi-agent .
```

### run container
```bash
docker run -d --name hanabi-agent -p 3041:3041 hanabi-agent
```