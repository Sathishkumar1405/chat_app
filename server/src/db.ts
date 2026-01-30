import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error('MONGO_URI must be defined in environment variables');
    }

    await mongoose.connect(mongoURI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      // Force IPv4 as some networks/ISPs have issues with SRV/Atlas and IPv6
      family: 4,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    // Exit process with failure code to let the process manager restart it
    process.exit(1);
  }
};

export default connectDB;
