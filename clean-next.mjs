import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanNextCache() {
  try {
    console.log('Cleaning Next.js cache...');
    
    const nextDir = path.join(process.cwd(), '.next');
    
    if (fs.existsSync(nextDir)) {
      await fs.promises.rm(nextDir, { recursive: true, force: true });
      console.log('Successfully cleaned Next.js cache');
    } else {
      console.log('.next directory does not exist');
    }
  } catch (error) {
    console.error('Error cleaning Next.js cache:', error);
  }
}

cleanNextCache();
