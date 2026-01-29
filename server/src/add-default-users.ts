import mongoose from 'mongoose';
import User from './models/User';
import Chat from './models/Chat';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const addDefaultUsersAndChat = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat_app';
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password', salt);

        const defaultUsersData = [
            { name: 'Alice Johnson', email: 'alice@example.com', avatar: 'A' },
            { name: 'Bob Smith', email: 'bob@example.com', avatar: 'B' },
            { name: 'Charlie Brown', email: 'charlie@example.com', avatar: 'C' }
        ];

        const userIds = [];

        // 1. Ensure Default Users Exist
        for (const userData of defaultUsersData) {
            let user = await User.findOne({ email: userData.email });
            if (!user) {
                user = await User.create({
                    ...userData,
                    password: hashedPassword
                });
                console.log(`Created default user: ${user.name}`);
            } else {
                console.log(`Default user already exists: ${user.name}`);
            }
            userIds.push(user._id);
        }

        // 2. Find Logged-in User
        const loggedInEmail = 'abiprasath6@gmai.com';
        const loggedInUser = await User.findOne({ email: loggedInEmail });

        if (loggedInUser) {
            console.log(`Found logged-in user: ${loggedInUser.name}`);
            userIds.push(loggedInUser._id);
        } else {
            console.log("Logged-in user not found. Skipping adding to chat.");
        }

        // 3. Create/Update Welcome Group Chat
        const chatName = 'Welcome Group';
        let welcomeChat = await Chat.findOne({ name: chatName });

        if (!welcomeChat) {
            welcomeChat = await Chat.create({
                name: chatName,
                type: 'group',
                members: userIds,
                lastMessage: {
                    text: 'Welcome to the chat app! Feel free to say hi.',
                    timestamp: new Date()
                }
            });
            console.log('Created Welcome Group chat');
        } else {
            // Update members to ensure everyone is in it
            welcomeChat.members = userIds;
            await welcomeChat.save();
            console.log('Updated Welcome Group chat members');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error in addDefaultUsersAndChat:', error);
        process.exit(1);
    }
};

addDefaultUsersAndChat();
