const asyncHandler = require('express-async-handler');
const Contact = require('../models/contact');

// @desc    Gửi liên hệ (public)
// @route   POST /api/contacts
// @access  Public
const createContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message, type } = req.body;
  const contact = await Contact.create({ name, email, phone, subject, message, type });
  res.status(201).json(contact);
});

// @desc    Lấy danh sách liên hệ (admin)
// @route   GET /api/contacts
// @access  Admin
const getContacts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status) query.status = status;

  const contacts = await Contact.find(query)
    .populate('assignedTo', 'fullName email')
    .populate('notes.createdBy', 'fullName')
    .sort('-createdAt')
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Contact.countDocuments(query);
  res.json({ contacts, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// @desc    Lấy chi tiết một liên hệ
// @route   GET /api/contacts/:id
// @access  Admin
const getContactById = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id)
    .populate('assignedTo', 'fullName email')
    .populate('notes.createdBy', 'fullName');
  if (!contact) {
    res.status(404);
    throw new Error('Không tìm thấy');
  }
  res.json(contact);
});

// @desc    Cập nhật trạng thái, phân công, thêm ghi chú
// @route   PUT /api/contacts/:id
// @access  Admin
const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    res.status(404);
    throw new Error('Không tìm thấy');
  }

  const { status, assignedTo, note } = req.body;
  if (status) contact.status = status;
  if (assignedTo) contact.assignedTo = assignedTo;
  if (note) {
    contact.notes.push({ content: note, createdBy: req.user._id });
  }
  if (status === 'resolved' && !contact.resolvedAt) {
    contact.resolvedAt = new Date();
  }
  await contact.save();
  res.json(contact);
});

// @desc    Xóa liên hệ
// @route   DELETE /api/contacts/:id
// @access  Admin
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    res.status(404);
    throw new Error('Không tìm thấy');
  }
  await contact.deleteOne();
  res.json({ message: 'Đã xóa' });
});

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
};