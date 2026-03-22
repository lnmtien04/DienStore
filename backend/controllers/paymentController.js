const querystring = require('qs');
const crypto = require('crypto');
const moment = require('moment');
const Order = require('../models/order'); // Đảm bảo đường dẫn đúng

// Tạo URL thanh toán VNPay
const createVNPayPayment = async (req, res) => {
  try {
    const { orderId, amount, orderInfo } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Đơn hàng đã được thanh toán' });
    }

    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL;
    const returnUrl = process.env.VNPAY_RETURN_URL;

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const orderIdVnp = order.orderNumber;

    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderIdVnp,
      vnp_OrderInfo: orderInfo || `Thanh toan don hang ${order.orderNumber}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const sortedParams = Object.keys(params).sort().reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {});

    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    params.vnp_SecureHash = signed;

    const paymentUrl = vnpUrl + '?' + querystring.stringify(params, { encode: false });
    res.json({ paymentUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi tạo thanh toán' });
  }
};

// Xử lý kết quả trả về từ VNPay
const vnpayReturn = async (req, res) => {
  const vnpParams = req.query;
  const secureHash = vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];

  const sortedParams = Object.keys(vnpParams).sort().reduce((obj, key) => {
    obj[key] = vnpParams[key];
    return obj;
  }, {});

  const signData = querystring.stringify(sortedParams, { encode: false });
  const secretKey = process.env.VNPAY_HASH_SECRET;
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  if (secureHash !== signed) {
    return res.status(400).json({ message: 'Chữ ký không hợp lệ' });
  }

  const orderIdVnp = vnpParams['vnp_TxnRef'];
  const responseCode = vnpParams['vnp_ResponseCode'];
  const transactionNo = vnpParams['vnp_TransactionNo'];
  const amount = vnpParams['vnp_Amount'] / 100;

  try {
    const order = await Order.findOne({ orderNumber: orderIdVnp });
    if (!order) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/fail?message=Đơn hàng không tồn tại`);
    }

    if (responseCode === '00') {
      order.paymentStatus = 'paid';
      order.transactionNo = transactionNo;
      order.paidAt = new Date();
      await order.save();
      res.redirect(`${process.env.CLIENT_URL}/payment/success?orderId=${order._id}`);
    } else {
      res.redirect(`${process.env.CLIENT_URL}/payment/fail?message=Thanh toán thất bại`);
    }
  } catch (error) {
    console.error(error);
    res.redirect(`${process.env.CLIENT_URL}/payment/fail?message=Lỗi server`);
  }
};

module.exports = { createVNPayPayment, vnpayReturn };