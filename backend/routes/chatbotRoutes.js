const express = require('express');
const router = express.Router();

// Dữ liệu FAQ mẫu
const faq = [
  { keywords: ['giờ mở cửa', 'mở cửa', 'thời gian'], answer: 'Cửa hàng mở cửa từ 8h đến 21h hàng ngày.' },
  { keywords: ['giao hàng', 'vận chuyển', 'ship'], answer: 'Chúng tôi giao hàng toàn quốc, phí ship từ 30.000đ. Thời gian giao từ 2-5 ngày.' },
  { keywords: ['thanh toán', 'trả tiền', 'payment'], answer: 'Chúng tôi chấp nhận thanh toán khi nhận hàng (COD) và chuyển khoản ngân hàng.' },
  { keywords: ['đổi trả', 'hoàn tiền', 'bảo hành'], answer: 'Sản phẩm được đổi trả trong vòng 7 ngày nếu lỗi nhà sản xuất. Vui lòng liên hệ hotline 1900xxxx để được hỗ trợ.' },
  { keywords: ['sản phẩm', 'hàng', 'mua'], answer: 'Bạn có thể xem danh sách sản phẩm tại trang chủ hoặc tìm kiếm sản phẩm theo danh mục.' },
];

router.post('/ask', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });

  const lowerMsg = message.toLowerCase();
  // Tìm câu trả lời phù hợp dựa trên từ khóa
  const matched = faq.find(item =>
    item.keywords.some(keyword => lowerMsg.includes(keyword))
  );

  if (matched) {
    return res.json({ reply: matched.answer });
  } else {
    return res.json({ reply: 'Xin lỗi, tôi chưa hiểu câu hỏi. Bạn có thể liên hệ hotline 1900xxxx để được tư vấn trực tiếp.' });
  }
});

module.exports = router;