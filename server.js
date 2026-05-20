const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let db;
let bookingsCollection;

async function connectDB() {
    console.log('🔍 Checking for MONGODB_URI...');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
        console.error('❌ MONGODB_URI is not defined');
        console.log('📋 Available env vars:', Object.keys(process.env));
        process.exit(1);
    }
    
    console.log('✅ MONGODB_URI found (length:', uri.length, 'characters)');
    console.log('🔗 First 50 chars:', uri.substring(0, 50) + '...');
    console.log('🔄 Creating MongoDB client...');
    
    const client = new MongoClient(uri);
    
    try {
        console.log('📡 Attempting to connect to MongoDB Atlas...');
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        
        console.log('📂 Selecting database: hostel_booking');
        db = client.db('hostel_booking');
        
        console.log('📂 Selecting collection: bookings');
        bookingsCollection = db.collection('bookings');
        
        console.log('✅ Database setup complete');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('📋 Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        throw error;
    }
}

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await bookingsCollection.find().sort({ createdAt: -1 }).toArray();
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const { name, email, branch, checkIn, checkOut, guests, totalPrice, message } = req.body;
        if (!name || !email || !branch || !checkIn || !checkOut || !guests) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const newBooking = {
            name,
            email,
            branch,
            checkIn,
            checkOut,
            guests: parseInt(guests),
            totalPrice: totalPrice || null,
            message: message || '',
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        const result = await bookingsCollection.insertOne(newBooking);
        res.status(201).json({ success: true, bookingId: result.insertedId, message: 'Booking request received!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Booking not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});

async function startServer() {
    console.log('🚀 Starting server...');
    try {
        await connectDB();
        console.log(`💻 Attempting to listen on port ${PORT}...`);
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.error('📋 Full error:', error);
        process.exit(1);
    }
}

startServer();