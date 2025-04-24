export const chatHandles = {
    EXIT: '/exit',
    FILE: '/file',
    MCP: '/mcp',
}

export const descriptions: {[key in keyof(typeof chatHandles)]: string} = {
    EXIT: 'Exit Hanabi',
    FILE: 'Add local file',
    MCP: 'Use MCP servers',
}