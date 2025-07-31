import express from 'express';
import cors from 'cors'; 
import routes from './routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Configuración del entorno y conexión a la base de datos
// Try to load from environments directory first, then fallback to root
try {
  dotenv.config({ path: path.resolve('environments', '.env') });
} catch (error) {
  dotenv.config(); // Load from root directory or system environment variables
}

const app = express();
const port = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// manejo de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// Se conecta a la DB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI_PRODUCTION || process.env.MONGODB_URI_LOCAL;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB :D');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
connectDB();

// Rutas
app.use('/api', routes);

app.get('/', (req, res) => {  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/test-error', (req, res, next) => {    
  const error = new Error('This is a test error!');
  error.status = 500;
  next(error);
});

// Manejo de errores en las rutas
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!',
    status: err.status || 500 
  });
});

// arranca el servidor
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port} :)`);
});