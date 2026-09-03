import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 4173;
const distIndex = path.join(__dirname, 'dist', 'index.html');

if (!fs.existsSync(distIndex)) {
  console.log('Frontend build not found. Running npm run build...');
  execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
}

app.use(express.static(path.join(__dirname, 'dist')));
app.use((_req, res) => res.sendFile(distIndex));
app.listen(port, '0.0.0.0', () => console.log(`GrosirHub frontend listening on ${port}`));
