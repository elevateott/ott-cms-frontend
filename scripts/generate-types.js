// scripts/generate-types.js
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Run the payload generate:types command with the --loader flag
const generateTypes = spawn('node', [
  '--no-warnings',
  '--experimental-loader=./.node-loaders.mjs',
  './node_modules/payload/dist/bin/index.js',
  'generate:types'
], {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--no-deprecation'
  }
});

generateTypes.on('close', (code) => {
  if (code !== 0) {
    console.error(`generate:types process exited with code ${code}`);
    process.exit(code);
  }
  console.log('Types generated successfully!');
});
