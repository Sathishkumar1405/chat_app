const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error('❌ MONGO_URI must be defined in environment variables');
        }

        await mongoose.connect(mongoURI, {
            tls: true,
            family: 4 // Force IPv4 for Atlas compatibility
        });

        console.log('✅ MongoDB connected successfully 🚀');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
