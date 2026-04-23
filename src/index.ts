#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { albumTools } from './albums.js';
import { playTools } from './play.js';
import { playlistTools } from './playlist.js';
import { readTools } from './read.js';
import { authorizeSpotify, initSpotifyConfig } from './utils.js';

async function runServer() {
  const server = new McpServer({
    name: 'spotify-controller',
    version: '1.0.0',
  });

  for (const tool of [
    ...readTools,
    ...playTools,
    ...albumTools,
    ...playlistTools,
  ]) {
    server.tool(tool.name, tool.description, tool.schema, tool.handler);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function runInit() {
  const result = await initSpotifyConfig();
  if (!result.created) {
    console.error(`Config already exists at ${result.path}; nothing to do.`);
  }
}

async function runAuth() {
  // Bootstrap a config first if one isn't there yet.
  const init = await initSpotifyConfig();
  if (init.created) {
    console.error('\nStarting Spotify authentication flow...');
  } else {
    console.error('Starting Spotify authentication flow...');
  }
  await authorizeSpotify();
  console.error('Authentication completed successfully!');
}

const subcommand = process.argv[2];

let task: Promise<void>;
switch (subcommand) {
  case 'auth':
    task = runAuth();
    break;
  case 'init':
    task = runInit();
    break;
  default:
    task = runServer();
}

task.catch((error) => {
  console.error(
    'Fatal error:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
