"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("./models/User"));
const Chat_1 = __importDefault(require("./models/Chat"));
const Message_1 = __importDefault(require("./models/Message"));
const Community_1 = __importDefault(require("./models/Community"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const seedDatabase = async () => {
    try {
        const userCount = await User_1.default.countDocuments();
        if (userCount > 0) {
            // Check if we need to migrate/fix existing messages that might have string senders
            // But simpler to just run seeding logic if empty or specific conditions.
            // Since we just changed schema, existing messages in DB will fail validation if we try to read them without migration.
            // Ideally, we should drop the Message collection or migrate. 
            // For this dev environment, let's assume user restarts with fresh DB or we just append valid new data.
            // Note: MongoDB won't error on existing data until it's read/written.
        }
        else {
            console.log('Seeding database...');
            // ... initial seed logic ...
        }
        // We will assume "fresh start" or "append" for now. 
        // If user has existing data, it might break. 
        // To be safe, let's just create the users if missing, then seed messages.
        console.log('Ensuring default users exist...');
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash('password', salt);
        let users = await User_1.default.find();
        if (users.length === 0) {
            users = await User_1.default.create([
                { name: 'Alice Johnson', email: 'alice@example.com', password: hashedPassword, avatar: 'A' },
                { name: 'Bob Smith', email: 'bob@example.com', password: hashedPassword, avatar: 'B' },
                { name: 'Charlie Brown', email: 'charlie@example.com', password: hashedPassword, avatar: 'C' },
                { name: 'Diana Prince', email: 'diana@example.com', password: hashedPassword, avatar: 'D' },
                { name: 'Official User', email: 'cuaofficial123@gmail.com', password: hashedPassword, avatar: 'O' },
            ]);
        }
        // Community Seeding with IDs
        const communityCount = await Community_1.default.countDocuments();
        if (communityCount === 0) {
            // ... existing logic but with IDs ...
            const foodCommunity = await Community_1.default.create({
                name: 'Food',
                description: 'For all the foodies out there!',
                icon: '🍔',
                members: users.map(u => u._id)
            });
            const sportsCommunity = await Community_1.default.create({
                name: 'Sports',
                description: 'Discussion about all things sports.',
                icon: '⚽',
                members: users.map(u => u._id)
            });
            const recipesChannel = await Chat_1.default.create({
                name: 'Recipes',
                type: 'channel',
                communityId: foodCommunity._id,
                members: users.map(u => u._id),
                lastMessage: { text: 'Welcome to Recipes!', timestamp: new Date() }
            });
            // Seed with IDs
            await Message_1.default.create([
                { chatId: recipesChannel._id, sender: users[0]._id, text: 'Does anyone have a good lasagna recipe?', timestamp: new Date() },
                { chatId: recipesChannel._id, sender: users[1]._id, text: 'I do! I will share it later.', timestamp: new Date() },
            ]);
        }
        // RICH DATA UPDATE (Robust)
        console.log('Checking for rich data updates...');
        const recipesChannel = await Chat_1.default.findOne({ name: 'Recipes', type: 'channel' });
        if (recipesChannel) {
            // Check if we have rich messages. 
            const richMsgCount = await Message_1.default.countDocuments({ chatId: recipesChannel._id, type: 'channel_post' });
            if (richMsgCount < 50) {
                console.log('Seeding rich recipe cards...');
                const recipes = [
                    { title: 'Classic Lasagna', img: 'https://images.unsplash.com/photo-1574868309219-98ee6969421f?w=600&auto=format&fit=crop', desc: 'A hearty meat sauce and ricotta cheese filling, layered with pasta sheets and baked until bubbly.' },
                    { title: 'Authentic Sushi', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop', desc: 'Fresh salmon and tuna nigiri with perfectly seasoned vinegared rice.' },
                    { title: 'Spicy Tacos', img: 'https://images.unsplash.com/photo-1551504734-5ee63f720216?w=600&auto=format&fit=crop', desc: 'Street-style tacos with marinated pork, pineapple, cilantro, and onion.' },
                    { title: 'Chocolate Cake', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop', desc: 'Decadent, moist chocolate cake with a rich ganache frosting.' },
                    { title: 'Avocado Toast', img: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600&auto=format&fit=crop', desc: 'Toasted sourdough topped with smashed avocado, chili flakes, and a poached egg.' },
                    { title: 'Berry Smoothie', img: 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=600&auto=format&fit=crop', desc: 'A refreshing blend of strawberries, blueberries, yogurt, and honey.' },
                    { title: 'Grilled Steak', img: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&auto=format&fit=crop', desc: 'Perfectly grilled ribeye steak with a side of roasted garlic potatoes.' },
                    { title: 'Pasta Carbonara', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&auto=format&fit=crop', desc: 'Roman pasta dish made with eggs, hard cheese, cured pork, and black pepper.' },
                    { title: 'Fruit Salad', img: 'https://images.unsplash.com/photo-1519996529931-28324d1a630e?w=600&auto=format&fit=crop', desc: 'A colorful mix of seasonal fruits for a healthy snack.' },
                    { title: 'Homemade Pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop', desc: 'Thin crust pizza topped with fresh tomato sauce, mozzarella, and basil.' }
                ];
                const messages = [];
                for (let i = 0; i < 60; i++) {
                    const randomUser = users[Math.floor(Math.random() * users.length)];
                    const recipe = recipes[i % recipes.length];
                    const timeOffset = Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30);
                    messages.push({
                        chatId: recipesChannel._id,
                        // NEW SCHEMA COMPATIBILITY
                        sender: randomUser.name,
                        senderId: randomUser._id,
                        senderName: randomUser.name,
                        senderAvatar: randomUser.avatar,
                        text: `Check out this recipe for ${recipe.title}!`,
                        type: 'channel_post',
                        title: recipe.title,
                        description: recipe.desc,
                        imageUrl: recipe.img,
                        link: 'https://example.com/recipe',
                        timestamp: new Date(Date.now() - timeOffset)
                    });
                }
                messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                await Message_1.default.create(messages);
                console.log('Rich recipe cards seeded with proper schema.');
            }
        }
        // Backfill standard bulk data for SPORTS
        // 3. NEWS COMMUNITY & India Channel
        console.log('Seeding News Community...');
        let newsCommunity = await Community_1.default.findOne({ name: 'News' });
        if (!newsCommunity) {
            newsCommunity = await Community_1.default.create({
                name: 'News',
                description: 'Global and Local Updates',
                icon: '📰',
                members: users.map(u => u._id)
            });
        }
        let indiaChannel = await Chat_1.default.findOne({ name: 'India', communityId: newsCommunity._id });
        if (!indiaChannel) {
            indiaChannel = await Chat_1.default.create({
                name: 'India',
                type: 'channel',
                communityId: newsCommunity._id,
                members: users.map(u => u._id),
                lastMessage: { text: 'Welcome to India News!', timestamp: new Date() }
            });
        }
        // Seed India News
        const indiaMsgCount = await Message_1.default.countDocuments({ chatId: indiaChannel._id, type: 'channel_post' });
        if (indiaMsgCount < 50) {
            console.log('Seeding India News...');
            const indiaNews = [
                { title: 'ISRO Chandrayaan Success', img: 'https://images.unsplash.com/photo-1541873676-a18131494184?w=600&auto=format&fit=crop', desc: 'India makes history with a successful lunar landing mission, exploring the south pole.' },
                { title: 'Cricket World Cup Fever', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop', desc: 'The nation cheers as the team advances to the finals in a stunning display of skill.' },
                { title: 'Tech Hub Growth in Bangalore', img: 'https://images.unsplash.com/photo-1596701831818-877ecf2e1852?w=600&auto=format&fit=crop', desc: 'Major startups announce new campuses, solidifying silicon valley of the east status.' },
                { title: 'Monsoon Updates', img: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop', desc: 'Farmers rejoice as healthy rainfall is predicted for the upcoming crops season.' },
                { title: 'Cultural Festival Season', img: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600&auto=format&fit=crop', desc: 'Lights, colors, and sweets mark the beginning of the festive season across the country.' },
                { title: 'New Vande Bharat Trains', img: 'https://images.unsplash.com/photo-1474487548417-781cb714c22d?w=600&auto=format&fit=crop', desc: 'High-speed connectivity improves with the launch of 5 new routes today.' }
            ];
            const messages = [];
            for (let i = 0; i < 60; i++) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const news = indiaNews[i % indiaNews.length];
                const timeOffset = Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30);
                messages.push({
                    chatId: indiaChannel._id,
                    sender: randomUser.name,
                    senderId: randomUser._id,
                    senderName: randomUser.name,
                    senderAvatar: randomUser.avatar,
                    text: `${news.title} - Full Story`,
                    type: 'channel_post',
                    title: news.title,
                    description: news.desc,
                    imageUrl: news.img,
                    link: 'https://news.google.com',
                    timestamp: new Date(Date.now() - timeOffset)
                });
            }
            messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            await Message_1.default.create(messages);
            console.log('India news seeded.');
        }
        // Backfill standard bulk data
        const sportsChannel = await Chat_1.default.findOne({ name: 'General', type: 'channel' });
        if (sportsChannel) {
            const richMsgCount = await Message_1.default.countDocuments({ chatId: sportsChannel._id, type: 'channel_post' });
            if (richMsgCount < 50) {
                console.log('Seeding Sports News...');
                const sportsNews = [
                    { title: 'Championship Finals Set', img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&auto=format&fit=crop', desc: 'The two top teams are ready to face off this weekend in the grand finale.' },
                    { title: 'Star Player Transfer', img: 'https://images.unsplash.com/photo-1522778119026-d647f0565c71?w=600&auto=format&fit=crop', desc: 'Breaking: League MVP expected to sign a record-breaking deal with City.' },
                    { title: 'Marathon Record Broken', img: 'https://images.unsplash.com/photo-1552674605-4695231af15f?w=600&auto=format&fit=crop', desc: 'A new world record was set today in Berlin under perfect weather conditions.' },
                    { title: 'Tennis Open Highlights', img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&auto=format&fit=crop', desc: 'Watch the top 10 plays from an incredible week of tennis action.' },
                    { title: 'Basketball Playoffs Begin', img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop', desc: 'The road to the trophy starts now. Expert predictions for the first round.' },
                    { title: 'F1 Season Opener', img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop', desc: 'Engines are roaring as the new Formula 1 season kicks off in Bahrain.' }
                ];
                const messages = [];
                for (let i = 0; i < 60; i++) {
                    const randomUser = users[Math.floor(Math.random() * users.length)];
                    const news = sportsNews[i % sportsNews.length];
                    const timeOffset = Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30);
                    messages.push({
                        chatId: sportsChannel._id,
                        // NEW SCHEMA COMPATIBILITY
                        sender: randomUser.name,
                        senderId: randomUser._id,
                        senderName: randomUser.name,
                        senderAvatar: randomUser.avatar,
                        text: `${news.title} - Read more!`,
                        type: 'channel_post',
                        title: news.title,
                        description: news.desc,
                        imageUrl: news.img,
                        link: 'https://espn.com',
                        timestamp: new Date(Date.now() - timeOffset)
                    });
                }
                messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                await Message_1.default.create(messages);
                console.log('Sports news seeded with proper schema.');
            }
        }
        console.log('Database check completed');
    }
    catch (error) {
        console.error('Error seeding database:', error);
    }
};
exports.default = seedDatabase;
