"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Community_1 = __importDefault(require("../models/Community"));
const Chat_1 = __importDefault(require("../models/Chat"));
const router = express_1.default.Router();
// Get all communities
router.get('/', async (req, res) => {
    try {
        const communities = await Community_1.default.find();
        res.json(communities);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching communities', error });
    }
});
// Get a specific community with its channels
router.get('/:id', async (req, res) => {
    try {
        const community = await Community_1.default.findById(req.params.id);
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }
        res.json(community);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching community', error });
    }
});
// Get channels for a specific community
router.get('/:id/channels', async (req, res) => {
    try {
        const channels = await Chat_1.default.find({
            communityId: req.params.id,
            type: 'channel'
        }).sort({ createdAt: 1 });
        res.json(channels);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching community channels', error });
    }
});
exports.default = router;
