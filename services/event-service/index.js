import express from "express";
import mongoose from "mongoose";
import cors from 'cors'
import cron from 'node-cron';
import eventRoutes from './routes/eventRoutes.js'
import { connectToKafka } from "./utils/kafka.js";
import { sendReminders } from "./controllers/eventContoller.js";

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

app.use('/api/event',eventRoutes);

app.use((err, req, res, next) => res.status(err.status || 500).send(err.message));

cron.schedule("18 18 * * *",() => {
    sendReminders();
})

app.listen(8001,() => {
        connectToKafka();
        console.log('Event Service running on port 8001');
})