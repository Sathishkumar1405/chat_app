import mongoose from 'mongoose';
import User from './models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const addUser = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB connected successfully 🚀');

        const email = 'abiprasath6@gmai.com';
        const name = email.split('@')[0]; // Use mail name as user name
        const password = 'password123';

        let user = await User.findOne({ email });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (user) {
            console.log('User already exists, updating name to:', name);
            user.name = name;
            user.password = hashedPassword; // Reset password just in case
            await user.save();
            console.log('User updated successfully:', user);
            process.exit(0);
        }

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            avatar: 'A'
        });

        await newUser.save();
        console.log('User created successfully:', newUser);
        process.exit(0);
    } catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }
};

addUser();
