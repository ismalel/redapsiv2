import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { uploadRouter } from './routes/upload';
import { psychologistsRouter } from './routes/psychologists';
import { consultantsRouter } from './routes/consultants';
import { therapiesRouter } from './routes/therapies';
import { therapyRequestsRouter } from './routes/therapy-requests';
import { notificationsRouter } from './routes/notifications';
import { propositionsRouter } from './routes/propositions';
import { sessionRequestsRouter } from './routes/session-requests';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Standard middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);
app.use('/psychologists', psychologistsRouter);
app.use('/consultants', consultantsRouter);
app.use('/therapies', therapiesRouter);
app.use('/therapy-requests', therapyRequestsRouter);
app.use('/notifications', notificationsRouter);
app.use('/propositions', propositionsRouter);
app.use('/session-requests', sessionRequestsRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
export { app };
