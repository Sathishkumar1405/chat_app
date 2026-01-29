"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("./models/User"));
const Chat_1 = __importDefault(require("./models/Chat"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env' });
const addDefaultUsersAndChat = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat_app';
        await mongoose_1.default.connect(mongoURI);
        console.log('MongoDB connected');
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash('password', salt);
        const defaultUsersData = [
            { name: 'Alice Johnson', email: 'alice@example.com', avatar: 'A' },
            { name: 'Bob Smith', email: 'bob@example.com', avatar: 'B' },
            { name: 'Charlie Brown', email: 'charlie@example.com', avatar: 'C' }
        ];
        const userIds = [];
        // 1. Ensure Default Users Exist
        for (const userData of defaultUsersData) {
            let user = await User_1.default.findOne({ email: userData.email });
            if (!user) {
                user = await User_1.default.create({
                    ...userData,
                    password: hashedPassword
                });
                console.log(`Created default user: ${user.name}`);
            }
            else {
                console.log(`Default user already exists: ${user.name}`);
            }
            userIds.push(user._id);
        }
        // 2. Find Logged-in User
        const loggedInEmail = 'abiprasath6@gmai.com';
        const loggedInUser = await User_1.default.findOne({ email: loggedInEmail });
        if (loggedInUser) {
            console.log(`Found logged-in user: ${loggedInUser.name}`);
            userIds.push(loggedInUser._id);
        }
        else {
            console.log("Logged-in user not found. Skipping adding to chat.");
        }
        // 3. Create/Update Welcome Group Chat
        const chatName = 'Welcome Group';
        let welcomeChat = await Chat_1.default.findOne({ name: chatName });
        if (!welcomeChat) {
            welcomeChat = await Chat_1.default.create({
                name: chatName,
                type: 'group',
                members: userIds,
                lastMessage: {
                    text: 'Welcome to the chat app! Feel free to say hi.',
                    timestamp: new Date()
                }
            });
            console.log('Created Welcome Group chat');
        }
        else {
            // Update members to ensure everyone is in it
            welcomeChat.members = userIds;
            await welcomeChat.save();
            console.log('Updated Welcome Group chat members');
        }
        process.exit(0);
    }
    catch (error) {
        console.error('Error in addDefaultUsersAndChat:', error);
        process.exit(1);
    }
};
addDefaultUsersAndChat();
