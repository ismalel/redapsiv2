import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Standard middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/health', healthRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
export { app };
