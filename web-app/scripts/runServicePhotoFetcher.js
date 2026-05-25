import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

console.log('Running service photo fetcher script...\n');

// Get directory name equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the TypeScript file
const scriptPath = join(__dirname, 'fetchServicesAndPhotos.ts');

// Run the script using tsx
const child = spawn('tsx', [scriptPath], {
  stdio: 'inherit',
  env: { ...process.env }
});

child.on('error', (error) => {
  console.error(`Error executing script: ${error.message}`);
});

child.on('close', (code) => {
  console.log(`Script exited with code ${code}`);
});