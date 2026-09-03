import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 4173;
const distDir = path.join(__dirname, 'dist');

app.use(express.static(distDir));
app.use((_req, res) => res.sendFile(path.join(distDir, 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`GrosirHub frontend listening on ${port}`));
