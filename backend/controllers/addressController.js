const Address = require('../models/address');

// @desc    Tạo địa chỉ mới
// @route   POST /api/addresses
// @access  Private
const createAddress = async (req, res) => {
  try {
    const { recipientName, phone, province, district, ward, detail, isDefault } = req.body;

    const address = await Address.create({
      user: req.user._id,
      recipientName,
      phone,
      province,
      district,
      ward,
      detail,
      isDefault,
    });

    // Nếu địa chỉ mới là mặc định, bỏ mặc định các địa chỉ khác
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: address._id } },
        { isDefault: false }
      );
    }

    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy tất cả địa chỉ của user
// @route   GET /api/addresses
// @access  Private
const getMyAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy địa chỉ theo ID
// @route   GET /api/addresses/:id
// @access  Private
const getAddressById = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ message: 'Địa chỉ không tồn tại' });
    }
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cập nhật địa chỉ
// @route   PUT /api/addresses/:id
// @access  Private
const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ message: 'Địa chỉ không tồn tại' });
    }

    const { recipientName, phone, province, district, ward, detail, isDefault } = req.body;

    address.recipientName = recipientName || address.recipientName;
    address.phone = phone || address.phone;
    address.province = province || address.province;
    address.district = district || address.district;
    address.ward = ward || address.ward;
    address.detail = detail || address.detail;

    // Nếu cập nhật isDefault thành true
    if (isDefault !== undefined && isDefault !== address.isDefault) {
      address.isDefault = isDefault;
      if (isDefault) {
        await Address.updateMany(
          { user: req.user._id, _id: { $ne: address._id } },
          { isDefault: false }
        );
      }
    }

    const updatedAddress = await address.save();
    res.json(updatedAddress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Xóa địa chỉ
// @route   DELETE /api/addresses/:id
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ message: 'Địa chỉ không tồn tại' });
    }

    await address.deleteOne();

    // Nếu xóa địa chỉ mặc định, set địa chỉ khác làm mặc định (nếu có)
    if (address.isDefault) {
      const anotherAddress = await Address.findOne({ user: req.user._id });
      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }

    res.json({ message: 'Đã xóa địa chỉ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Đặt địa chỉ mặc định
// @route   PUT /api/addresses/:id/default
// @access  Private
const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ message: 'Địa chỉ không tồn tại' });
    }

    // Đặt tất cả địa chỉ của user về false
    await Address.updateMany({ user: req.user._id }, { isDefault: false });

    // Set địa chỉ này thành true
    address.isDefault = true;
    await address.save();

    res.json({ message: 'Đã đặt địa chỉ mặc định', address });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};