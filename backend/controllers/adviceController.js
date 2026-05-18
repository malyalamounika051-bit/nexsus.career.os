const Advice = require('../models/Advice');

// @desc   Get all advice posts (paginated)
// @route  GET /api/advice
// @access Public
const getAllAdvice = async (req, res) => {
  try {
    const { tag, page = 1, limit = 20 } = req.query;
    const filter = tag ? { tags: { $in: [tag] } } : {};
    const advice = await Advice.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Advice.countDocuments(filter);
    res.json({ success: true, data: advice, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Create an advice post
// @route  POST /api/advice
// @access Private
const createAdvice = async (req, res) => {
  try {
    const { content, tags } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    const advice = await Advice.create({
      userId: req.user.id,
      author: req.user.name,
      avatar: req.user.avatar || '',
      content,
      tags: tags || [],
    });
    res.status(201).json({ success: true, data: advice });
  } catch (error) {
    console.error('Create advice error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Like / Unlike an advice post (toggle)
// @route  PUT /api/advice/:id/like
// @access Private
const toggleLike = async (req, res) => {
  try {
    const advice = await Advice.findById(req.params.id);
    if (!advice) {
      return res.status(404).json({ success: false, message: 'Advice not found' });
    }

    const userId = req.user.id;
    const alreadyLiked = advice.likedBy.includes(userId);

    if (alreadyLiked) {
      advice.likedBy = advice.likedBy.filter((id) => id.toString() !== userId);
      advice.likes = Math.max(0, advice.likes - 1);
    } else {
      advice.likedBy.push(userId);
      advice.likes += 1;
    }

    await advice.save();
    res.json({ success: true, likes: advice.likes, liked: !alreadyLiked });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Delete own advice
// @route  DELETE /api/advice/:id
// @access Private
const deleteAdvice = async (req, res) => {
  try {
    const advice = await Advice.findById(req.params.id);
    if (!advice) return res.status(404).json({ success: false, message: 'Not found' });
    if (advice.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await advice.deleteOne();
    res.json({ success: true, message: 'Advice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllAdvice, createAdvice, toggleLike, deleteAdvice };
