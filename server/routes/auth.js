const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// makes the entry pass (token)
const makeToken = u =>
  jwt.sign({ id: u._id, role: u.role, name: u.name },
    process.env.JWT_SECRET, { expiresIn: '7d' });

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'All fields are required' });
    if (!['faculty', 'student'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({
      name, email, role, password: await bcrypt.hash(password, 10)
    });
    res.status(201).json({
      token: makeToken(user),
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid email or password' });
    res.json({
      token: makeToken(user),
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;