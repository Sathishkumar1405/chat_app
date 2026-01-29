"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("./models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env' }); // Adjusted path for .env since we are in src
const addUser = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat_app';
        await mongoose_1.default.connect(mongoURI);
        console.log('MongoDB connected');
        const email = 'abiprasath6@gmai.com';
        const name = email.split('@')[0]; // Use mail name as user name
        const password = 'password123';
        let user = await User_1.default.findOne({ email });
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        if (user) {
            console.log('User already exists, updating name to:', name);
            user.name = name;
            user.password = hashedPassword; // Reset password just in case
            await user.save();
            console.log('User updated successfully:', user);
            process.exit(0);
        }
        const newUser = new User_1.default({
            name,
            email,
            password: hashedPassword,
            avatar: 'A'
        });
        await newUser.save();
        console.log('User created successfully:', newUser);
        process.exit(0);
    }
    catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }
};
addUser();
