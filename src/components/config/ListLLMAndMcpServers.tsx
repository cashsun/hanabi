import { Box, Text } from 'ink';
import React, { FC, useMemo } from 'react';
import { configPath, getConfig } from './util.js';

/**
 * Component to display a list of configured LLMs and MCP servers
 */
const ListLLMAndMcpServers: FC = () => {
  const config = useMemo(()=> getConfig(), []);

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold backgroundColor="blue" color="white">
          Configuration
        </Text>
        <Text color="gray">({configPath})</Text>
      </Box>

      {/* LLMs Section */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold underline>
          Language Models ({config.llms.length})
        </Text>
        
        {config.llms.length === 0 ? (
          <Text color="yellow">No language models configured</Text>
        ) : (
          config.llms.map((llm: LLM, index: number) => (
            <Box key={index} flexDirection="column" marginLeft={2} marginTop={1}>
              <Text bold color="green">{llm.id}</Text>
              <Box marginLeft={2} flexDirection="column">
                <Text>Provider: <Text color="cyan">{llm.provider}</Text></Text>
                {llm.apiUrl && <Text>API URL: <Text color="gray">{llm.apiUrl}</Text></Text>}
                {llm.apiVersion && <Text>API Version: <Text color="gray">{llm.apiVersion}</Text></Text>}
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* MCP Servers Section */}
      <Box flexDirection="column">
        <Text bold underline>
          MCP Servers ({Object.keys(config.mcpServers || {}).length})
        </Text>
        
        {!config.mcpServers || Object.keys(config.mcpServers).length === 0 ? (
          <Text color="yellow">No MCP servers configured</Text>
        ) : (
          Object.entries(config.mcpServers).map(([key, server]: [string, MCPServerConfig], index: number) => (
            <Box key={index} flexDirection="column" marginLeft={2} marginTop={1}>
              <Text bold color="green">{key}: <Text color="white">{server.name}</Text></Text>
              <Box marginLeft={2} flexDirection="column">
                <Text>Transport: <Text color="cyan">{server.transport}</Text></Text>
                {server.transport === 'stdio' && (
                  <>
                    <Text>Command: <Text color="gray">{server.command}</Text></Text>
                    <Text>Args: <Text color="gray">{server.args.join(' ')}</Text></Text>
                  </>
                )}
                {server.transport !== 'stdio' && 'url' in server && (
                  <Text>URL: <Text color="gray">{server.url}</Text></Text>
                )}
                {server.version && <Text>Version: <Text color="gray">{server.version}</Text></Text>}
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Default Model Section */}
      {config.defaultModel && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold underline>Default Model</Text>
          <Box marginLeft={2}>
            <Text>
              Provider: <Text color="cyan">{config.defaultModel.provider}</Text>, 
              Model: <Text color="cyan">{config.defaultModel.model}</Text>
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ListLLMAndMcpServers;