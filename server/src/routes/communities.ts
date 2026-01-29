import express, { Request, Response } from 'express';
import Community from '../models/Community';
import Chat from '../models/Chat';

const router = express.Router();

// Get all communities
router.get('/', async (req: Request, res: Response) => {
    try {
        const communities = await Community.find();
        res.json(communities);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching communities', error });
    }
});

// Get a specific community with its channels
router.get('/:id', async (req: Request, res: Response) => {
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
router.get('/:id/channels', async (req: Request, res: Response) => {
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

export default router;
