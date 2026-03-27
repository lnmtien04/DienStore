const moment = require('moment');
const Order = require('../models/order');
const { sortObject, buildSignData, createSecureHash } = require('../utils/vnpayHelper');

function removeDiacritics(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function buildUrlEncoded(params) {
    const sorted = sortObject(params);
    let url = '';
    for (let key in sorted) {
        let value = sorted[key];
        if (value === null || value === undefined) continue;
        let encoded = encodeURIComponent(value).replace(/%20/g, '+');
        url += (url ? '&' : '') + key + '=' + encoded;
    }
    return url;
}

exports.createVNPayPayment = async (req, res) => {
    try {
        const { orderId, amount, orderInfo } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Đã thanh toán' });
        if (Number(amount) !== Number(order.totalAmount)) {
            return res.status(400).json({ message: `Số tiền không khớp: ${amount} vs ${order.totalAmount}` });
        }

        const tmnCode = process.env.VNPAY_TMN_CODE;
        const secretKey = process.env.VNPAY_HASH_SECRET;
        const vnpUrl = process.env.VNPAY_URL;
        const returnUrl = process.env.VNPAY_RETURN_URL;

        if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
            return res.status(500).json({ message: 'Thiếu cấu hình VNPay' });
        }

        let ipAddr = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        if (ipAddr.includes('::')) ipAddr = '127.0.0.1';

        const createDate = moment().format('YYYYMMDDHHmmss');
        const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');
        const txnRef = `${order.orderNumber}_${Date.now()}`;

        let cleanOrderInfo = orderInfo || `Thanh toan don hang ${order.orderNumber}`;
        cleanOrderInfo = removeDiacritics(cleanOrderInfo).replace(/[^\w\s]/g, '');

        let params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: cleanOrderInfo,
            vnp_OrderType: 'other',
            vnp_Amount: Math.round(Number(amount) * 100),
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDate,
        };

        // Sắp xếp tham số (không có hash)
        const sortedParams = sortObject(params);

        // Tạo signData và hash
        const signData = buildSignData(sortedParams);
        const secureHash = createSecureHash(signData, secretKey);

        // Thêm hash vào params
        const finalParams = { ...sortedParams, vnp_SecureHash: secureHash };

        // Tạo URL với encode giống hệt
        const urlEncoded = buildUrlEncoded(finalParams);
        const paymentUrl = `${vnpUrl}?${urlEncoded}`;

        console.log('=== CREATE VNPAY PAYMENT ===');
        console.log('Sorted Params:', sortedParams);
        console.log('SignData:', signData);
        console.log('SecureHash:', secureHash);
        console.log('Payment URL:', paymentUrl);

        res.json({ paymentUrl });
    } catch (error) {
        console.error('createVNPayPayment error:', error);
        res.status(500).json({ message: 'Lỗi tạo thanh toán' });
    }
};

exports.vnpayReturn = async (req, res) => {
    try {
        let vnpParams = { ...req.query };
        const secureHash = vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHashType'];

        // Sắp xếp tham số nhận về
        const sortedParams = sortObject(vnpParams);

        // Tạo lại signData
        const signData = buildSignData(sortedParams);
        const secretKey = process.env.VNPAY_HASH_SECRET;
        const signed = createSecureHash(signData, secretKey);

        console.log('=== VNPAY RETURN ===');
        console.log('Received Params:', vnpParams);
        console.log('Sorted Params:', sortedParams);
        console.log('SignData:', signData);
        console.log('Received Hash:', secureHash);
        console.log('Calculated Hash:', signed);

        if (secureHash !== signed) {
            console.warn('Invalid signature!');
            return res.redirect(`${process.env.CLIENT_URL}/payment/fail?message=Sai chữ ký`);
        }

        const txnRef = sortedParams['vnp_TxnRef'];
        const responseCode = sortedParams['vnp_ResponseCode'];
        const transactionNo = sortedParams['vnp_TransactionNo'];
        const orderNumber = txnRef.split('_')[0];

        const order = await Order.findOne({ orderNumber });
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
            res.redirect(`${process.env.CLIENT_URL}/payment/fail?message=Thanh toán thất bại (${responseCode})`);
        }
    } catch (error) {
        console.error('vnpayReturn error:', error);
        res.redirect(`${process.env.CLIENT_URL}/payment/fail?message=Lỗi server`);
    }
};