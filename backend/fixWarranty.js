const mongoose = require('mongoose');
const Product = require('./models/product'); // Đảm bảo đường dẫn đúng
require('dotenv').config();

const fixWarranty = async () => {
  try {
    // Kết nối database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Đã kết nối database');

    // Tìm tất cả sản phẩm có warranty là string
    const products = await Product.find({ warranty: { $type: 'string' } });
    console.log(`🔍 Tìm thấy ${products.length} sản phẩm có warranty dạng string`);

    if (products.length === 0) {
      console.log('🎉 Không còn sản phẩm nào bị lỗi warranty');
      process.exit(0);
    }

    // Cập nhật từng cái và log chi tiết
    for (const product of products) {
      console.log(`🛠️ Đang sửa sản phẩm: ${product.name} - warranty cũ: "${product.warranty}"`);
      product.warranty = null;
      await product.save();
      console.log(`✅ Đã sửa thành công`);
    }

    console.log('🎉 Hoàn tất!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

fixWarranty();