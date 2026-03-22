const mongoose = require('mongoose');

const postCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
}, { timestamps: true });

module.exports = mongoose.model('PostCategory', postCategorySchema);