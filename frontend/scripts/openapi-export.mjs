#!/usr/bin/env node
// Wrapper offline para regenerar openapi.json compilando el backend con MSBuild.
// Garantiza ASPNETCORE_ENVIRONMENT=Development en cualquier plataforma (Windows/macOS/Linux).

import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, '..');
const projectPath = resolve(webRoot, '..', 'backend', 'POS.Api', 'POS.Api.csproj');

const args = [
  'build',
  projectPath,
  '-c', 'Debug'
];

const child = spawn('dotnet', args, {
  cwd: webRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    ASPNETCORE_ENVIRONMENT: 'Development',
    DOTNET_ENVIRONMENT: 'Development'
  }
});

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('[openapi:export] No se pudo invocar dotnet. ¿SDK .NET instalado y en el PATH?');
  console.error(err);
  process.exit(1);
});
