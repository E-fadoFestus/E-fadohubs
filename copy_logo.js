import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Ensure the public directory exists
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
    console.log('Created public/ folder.');
  }

  // Copy logo to public as different sizes
  const sourcePath = path.resolve(__dirname, 'src', 'assets', 'images', 'efado_logo_1781368963212.jpg');
  const dest192 = path.resolve(__dirname, 'public', 'efado_logo_192.jpg');
  const dest512 = path.resolve(__dirname, 'public', 'efado_logo_512.jpg');

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, dest192);
    fs.copyFileSync(sourcePath, dest512);
    console.log('Successfully copied logo to public/efado_logo_192.jpg and public/efado_logo_512.jpg');
  } else {
    console.error('Source logo file not found at:', sourcePath);
  }
} catch (err) {
  console.error('Error during copying:', err);
}
