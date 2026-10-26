const router = require('express').Router();
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { protect, allow } = require('../middleware/auth');

// FACULTY: create an assignment
router.post('/', protect, allow('faculty'), async (req, res) => {
  try {
    const { title, subject, description, dueDate, maxMarks, allowResubmit } = req.body;
    if (!title || !subject || !dueDate || !maxMarks)
      return res.status(400).json({ message: 'Title, subject, due date and max marks are required' });
    if (Number(maxMarks) <= 0)
      return res.status(400).json({ message: 'Max marks must be more than 0' });
    if (isNaN(new Date(dueDate)))
      return res.status(400).json({ message: 'Invalid due date' });

    const assignment = await Assignment.create({
      title, subject, description, dueDate, maxMarks, allowResubmit,
      createdBy: req.user.id
    });
    res.status(201).json(assignment);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// FACULTY: own assignments with counts | STUDENT: all with status
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'faculty') {
      const list = await Assignment.find({ createdBy: req.user.id }).sort({ dueDate: 1 }).lean();
      const subs = await Submission.find({ assignment: { $in: list.map(a => a._id) } })
        .select('assignment marks').lean();

      const result = list.map(a => {
        const mine = subs.filter(s => String(s.assignment) === String(a._id));
        return {
          ...a,
          submissionCount: mine.length,
          gradedCount: mine.filter(s => s.marks !== null).length
        };
      });
      return res.json(result);
    }

    const list = await Assignment.find().sort({ dueDate: 1 }).lean();
    const subs = await Submission.find({ student: req.user.id }).lean();
    const byAssignment = {};
    subs.forEach(s => { byAssignment[s.assignment] = s; });

    const result = list.map(a => {
      const s = byAssignment[a._id];
      let status = 'Pending';
      if (s) status = s.marks === null ? 'Submitted' : 'Graded';
      return { ...a, status, submission: s || null };
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// FACULTY: delete own assignment and its submissions
router.delete('/:id', protect, allow('faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: 'Invalid assignment id' });

    const assignment = await Assignment.findById(id);
    if (!assignment)
      return res.status(404).json({ message: 'Assignment not found' });
    if (String(assignment.createdBy) !== req.user.id)
      return res.status(403).json({ message: 'Not your assignment' });

    await Submission.deleteMany({ assignment: id });
    await assignment.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;