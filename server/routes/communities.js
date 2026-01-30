const express = require('express');
const Community = require('../models/Community');
const Chat = require('../models/Chat');

const router = express.Router();

// Get all communities
router.get('/', async (req, res) => {
    try {
        const communities = await Community.find();
        res.json(communities);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching communities', error });
    }
});

// Get a specific community with its channels
router.get('/:id', async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }
        res.json(community);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching community', error });
    }
});

// Get channels for a specific community
router.get('/:id/channels', async (req, res) => {
    try {
        const channels = await Chat.find({
            communityId: req.params.id,
            type: 'channel'
        }).sort({ createdAt: 1 });

        res.json(channels);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching community channels', error });
    }
});

module.exports = router;
