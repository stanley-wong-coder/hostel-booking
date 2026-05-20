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
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is not defined in .env file');
        process.exit(1);
    }
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        db = client.db('hostel_booking');
        bookingsCollection = db.collection('bookings');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
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
    await connectDB();
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

startServer();