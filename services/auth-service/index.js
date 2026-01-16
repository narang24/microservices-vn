import express from "express";
import mongoose from "mongoose";
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import { connectToKafka } from "./utils/kafka.js";

const app = express();

app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET','POST','PUT','DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {});
        console.log('MongoDB connected successfully');
    } catch(error) {
        console.log('Error connecting to MongoDB', error);
        process.exit(1);
    }
}

connectDB();

app.use('/api/auth',authRoutes);

app.use((err, req, res, next) => res.status(err.status || 500).send(err.message));

app.listen(8000,() => {
        connectToKafka();
        console.log('Auth Service running on port 8000');
})