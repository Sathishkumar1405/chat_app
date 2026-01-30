const User = require('./models/User');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const Community = require('./models/Community');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            // Data exists, skip seeding or handle migration
        } else {
            console.log('Seeding database...');
        }

        console.log('Ensuring default users exist...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password', salt);

        let users = await User.find();
        if (users.length === 0) {
            users = await User.create([
                { name: 'Alice Johnson', email: 'alice@example.com', password: hashedPassword, avatar: 'A' },
                { name: 'Bob Smith', email: 'bob@example.com', password: hashedPassword, avatar: 'B' },
                { name: 'Charlie Brown', email: 'charlie@example.com', password: hashedPassword, avatar: 'C' },
                { name: 'Diana Prince', email: 'diana@example.com', password: hashedPassword, avatar: 'D' },
                { name: 'Official User', email: 'cuaofficial123@gmail.com', password: hashedPassword, avatar: 'O' },
            ]);
        }

        // Community Seeding
        const communityCount = await Community.countDocuments();
        if (communityCount === 0) {
            const foodCommunity = await Community.create({
                name: 'Food',
                description: 'For all the foodies out there!',
                icon: '🍔',
                members: users.map(u => u._id)
            });
            const sportsCommunity = await Community.create({
                name: 'Sports',
                description: 'Discussion about all things sports.',
                icon: '⚽',
                members: users.map(u => u._id)
            });

            const recipesChannel = await Chat.create({
                name: 'Recipes',
                type: 'channel',
                communityId: foodCommunity._id,
                members: users.map(u => u._id),
                lastMessage: { text: 'Welcome to Recipes!', timestamp: new Date() }
            });

            await Message.create([
                { chatId: recipesChannel._id, sender: users[0]._id, text: 'Does anyone have a good lasagna recipe?', timestamp: new Date() },
                { chatId: recipesChannel._id, sender: users[1]._id, text: 'I do! I will share it later.', timestamp: new Date() },
            ]);
        }

        // RICH DATA UPDATE
        const recipesChannel = await Chat.findOne({ name: 'Recipes', type: 'channel' });
        if (recipesChannel) {
            const richMsgCount = await Message.countDocuments({ chatId: recipesChannel._id, type: 'channel_post' });

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
                await Message.create(messages);
                console.log('Rich recipe cards seeded.');
            }
        }

        // News Community
        let newsCommunity = await Community.findOne({ name: 'News' });
        if (!newsCommunity) {
            newsCommunity = await Community.create({
                name: 'News',
                description: 'Global and Local Updates',
                icon: '📰',
                members: users.map(u => u._id)
            });
        }

        let indiaChannel = await Chat.findOne({ name: 'India', communityId: newsCommunity._id });
        if (!indiaChannel) {
            indiaChannel = await Chat.create({
                name: 'India',
                type: 'channel',
                communityId: newsCommunity._id,
                members: users.map(u => u._id),
                lastMessage: { text: 'Welcome to India News!', timestamp: new Date() }
            });
        }

        const indiaMsgCount = await Message.countDocuments({ chatId: indiaChannel._id, type: 'channel_post' });
        if (indiaMsgCount < 50) {
            const indiaNews = [
                { title: 'ISRO Chandrayaan Success', img: 'https://images.unsplash.com/photo-1541873676-a18131494184?w=600&auto=format&fit=crop', desc: 'India makes history with a successful lunar landing mission.' },
                { title: 'Cricket World Cup Fever', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop', desc: 'The nation cheers for the team in the finals.' },
                { title: 'Tech Hub Growth in Bangalore', img: 'https://images.unsplash.com/photo-1596701831818-877ecf2e1852?w=600&auto=format&fit=crop', desc: 'Major startups announce new campuses.' },
                { title: 'Monsoon Updates', img: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop', desc: 'Healthy rainfall predicted for the crops season.' },
                { title: 'Cultural Festival Season', img: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600&auto=format&fit=crop', desc: 'Lights and colors across the country.' },
                { title: 'New Vande Bharat Trains', img: 'https://images.unsplash.com/photo-1474487548417-781cb714c22d?w=600&auto=format&fit=crop', desc: 'Launch of 5 new routes today.' }
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
            await Message.create(messages);
            console.log('India news seeded.');
        }

        console.log('Database check completed');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

module.exports = seedDatabase;
