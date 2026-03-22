const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const accountSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  province: { type: String }, // Tên tỉnh/thành
  provinceCode: { type: String }, // Mã tỉnh (để chọn dropdown)
  address: { type: String },
  avatar: { type: String },
  bio: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  background: { type: String },
  school: { type: String },
  dob: { type: Date },
  company: { type: String },
  jobTitle: { type: String },
  roles: { type: [String], default: ['customer'] },
  role: {
    type: String,
    enum: ['user', 'admin', 'staff'],
    default: 'user'
  },
  isActive: { type: Boolean, default: true },
  preferredLanguage: {
    type: String,
    enum: ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ru'],
    default: 'vi',
  },
}, { timestamps: true });

//

accountSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

accountSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('account', accountSchema, 'users');