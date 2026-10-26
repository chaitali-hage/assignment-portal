const router = require('express').Router();
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { protect, allow } = require('../middleware/auth');

// STUDENT: submit work
router.post('/:assignmentId', protect, allow('student'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { notes, projectLink } = req.body;

    if (!mongoose.isValidObjectId(assignmentId))
      return res.status(400).json({ message: 'Invalid assignment id' });
    if (!projectLink)
      return res.status(400).json({ message: 'Project link is required' });

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res.status(404).json({ message: 'Assignment not found' });

    // rule: no submissions after the due date
    if (new Date() > new Date(assignment.dueDate))
      return res.status(400).json({ message: 'Due date has passed. Submission not allowed' });

    const existing = await Submission.findOne({
      assignment: assignmentId, student: req.user.id
    });

    if (existing) {
      // rule: only one submission unless teacher allowed resubmit
      if (!assignment.allowResubmit)
        return res.status(400).json({ message: 'You have already submitted this assignment' });
      existing.notes = notes || '';
      existing.projectLink = projectLink;
      existing.marks = null;
      existing.remarks = '';
      existing.gradedAt = null;
      await existing.save();
      return res.json(existing);
    }

    const sub = await Submission.create({
      assignment: assignmentId, student: req.user.id, notes, projectLink
    });
    res.status(201).json(sub);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// STUDENT: see my own submissions with grades
router.get('/mine', protect, allow('student'), async (req, res) => {
  try {
    const subs = await Submission.find({ student: req.user.id })
      .populate('assignment', 'title subject dueDate maxMarks')
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// FACULTY: see all submissions for one of their assignments
router.get('/assignment/:assignmentId', protect, allow('faculty'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    if (!mongoose.isValidObjectId(assignmentId))
      return res.status(400).json({ message: 'Invalid assignment id' });

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res.status(404).json({ message: 'Assignment not found' });
    if (String(assignment.createdBy) !== req.user.id)
      return res.status(403).json({ message: 'Not your assignment' });

    const subs = await Submission.find({ assignment: assignmentId })
      .populate('student', 'name email')
      .sort({ createdAt: 1 });
    res.json(subs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// FACULTY: give marks and remarks
router.put('/:id/grade', protect, allow('faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    const { marks, remarks } = req.body;

    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: 'Invalid submission id' });

    const sub = await Submission.findById(id).populate('assignment');
    if (!sub)
      return res.status(404).json({ message: 'Submission not found' });
    if (String(sub.assignment.createdBy) !== req.user.id)
      return res.status(403).json({ message: 'Not your assignment' });

    const m = Number(marks);
    if (marks === undefined || marks === '' || isNaN(m))
      return res.status(400).json({ message: 'Marks must be a number' });
    if (m < 0)
      return res.status(400).json({ message: 'Marks cannot be negative' });
    if (m > sub.assignment.maxMarks)
      return res.status(400).json({ message: `Marks cannot be more than ${sub.assignment.maxMarks}` });

    sub.marks = m;
    sub.remarks = remarks || '';
    sub.gradedAt = new Date();
    await sub.save();
    res.json(sub);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;