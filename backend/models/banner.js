const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true }, // URL ảnh
  link: { type: String }, // Link khi click
  position: { 
    type: String, 
    enum: ['home', 'product', 'category', 'sidebar'], 
    default: 'home' 
  },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);