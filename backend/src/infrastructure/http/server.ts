import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or current directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { app } from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[REDAPSI] Server running on port ${PORT}`);
  console.log(`[REDAPSI] Health check: http://localhost:${PORT}/health`);
});
