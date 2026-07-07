const StudyGroup = require('../models/StudyGroup');

// Generate a random 5-character join code (unambiguous chars only)
const generateJoinCode = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I, L, O, 0, 1
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// Generate a join code guaranteed unique in the DB
const generateUniqueJoinCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = generateJoinCode();
    exists = await StudyGroup.exists({ joinCode: code });
  }
  return code;
};

const isMember = (group, userId) =>
  group.members.some((m) => m._id?.toString() === userId.toString() || m.toString() === userId.toString());

// Standard populated shape we send to the client
const populateGroup = (query) =>
  query
    .populate('owner', 'name email')
    .populate('members', 'name email')
    .populate('goals.addedBy', 'name')
    .populate('goals.completedBy', 'name');

// @desc    Get all groups the current user is a member of
// @route   GET /api/groups
const getMyGroups = async (req, res) => {
  try {
    const groups = await populateGroup(
      StudyGroup.find({ members: req.user._id }).sort({ updatedAt: -1 })
    );
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get one group (must be a member)
// @route   GET /api/groups/:id
const getGroup = async (req, res) => {
  try {
    const group = await populateGroup(StudyGroup.findById(req.params.id));
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!isMember(group, req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a group
// @route   POST /api/groups
const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const joinCode = await generateUniqueJoinCode();

    const group = await StudyGroup.create({
      name: name.trim(),
      joinCode,
      owner: req.user._id,
      members: [req.user._id],
      goals: [],
    });

    const populated = await populateGroup(StudyGroup.findById(group._id));
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a group by code
// @route   POST /api/groups/join
const joinGroup = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Join code is required' });
    }

    const group = await StudyGroup.findOne({ joinCode: code.trim().toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'No group found with that code' });
    }

    if (isMember(group, req.user._id)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    group.members.push(req.user._id);
    await group.save();

    const populated = await populateGroup(StudyGroup.findById(group._id));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave a group (owner cannot leave; they must delete)
// @route   POST /api/groups/:id/leave
const leaveGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!isMember(group, req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }
    if (group.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Owners cannot leave their own group. Delete it instead.' });
    }

    group.members = group.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );
    await group.save();

    res.json({ message: 'Left the group.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a group (owner only)
// @route   DELETE /api/groups/:id
const deleteGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (group.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete the group' });
    }

    await StudyGroup.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== Goals =====

// @desc    Add a goal to the group (any member)
// @route   POST /api/groups/:id/goals
const addGoal = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Goal title is required' });
    }

    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!isMember(group, req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    group.goals.push({
      title: title.trim(),
      completed: false,
      addedBy: req.user._id,
    });
    await group.save();

    const populated = await populateGroup(StudyGroup.findById(group._id));
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle a goal's completion (any member)
// @route   PUT /api/groups/:id/goals/:goalId
const toggleGoal = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!isMember(group, req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const goal = group.goals.id(req.params.goalId);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.completed = !goal.completed;
    goal.completedBy = goal.completed ? req.user._id : null;
    await group.save();

    const populated = await populateGroup(StudyGroup.findById(group._id));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a goal (any member)
// @route   DELETE /api/groups/:id/goals/:goalId
const deleteGoal = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!isMember(group, req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const goal = group.goals.id(req.params.goalId);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.deleteOne();
    await group.save();

    const populated = await populateGroup(StudyGroup.findById(group._id));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  deleteGroup,
  addGoal,
  toggleGoal,
  deleteGoal,
};