const crypto = require('crypto');
const qs = require('qs');

class VNPay {
  constructor(config) {
    this.vnp_TmnCode = config.vnp_TmnCode;
    this.vnp_HashSecret = config.vnp_HashSecret;
    this.vnp_Url = config.vnp_Url;
    this.vnp_ReturnUrl = config.vnp_ReturnUrl;
  }

  buildPaymentUrl(params) {
    const { amount, orderId, orderInfo, ipAddr, locale = 'vn', bankCode } = params;

    // Tạo createDate theo giờ Việt Nam (UTC+7)
    const date = new Date();
    const createDate =
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0') +
      date.getSeconds().toString().padStart(2, '0');

    const orderType = '250000';

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Amount: amount * 100,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Locale: locale,
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) {
      vnp_Params.vnp_BankCode = bankCode;
    }

    // Sắp xếp key theo alphabet
    const sortedParams = {};
    Object.keys(vnp_Params)
      .sort()
      .forEach(key => { sortedParams[key] = vnp_Params[key]; });

    // Tạo chuỗi ký (dùng qs.stringify với encode = false)
    const signData = qs.stringify(sortedParams, { encode: false });
    console.log('SignData:', signData);

    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    sortedParams.vnp_SecureHash = signed;

    // Tạo URL (dùng qs.stringify với encode = true)
    const paymentUrl = this.vnp_Url + '?' + qs.stringify(sortedParams, { encode: true });
    return paymentUrl;
  }

  verifyReturnUrl(query) {
    const secureHash = query.vnp_SecureHash;
    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    const sortedParams = {};
    Object.keys(query)
      .sort()
      .forEach(key => { sortedParams[key] = query[key]; });

    const signData = qs.stringify(sortedParams, { encode: false });
    console.log('Verify signData:', signData);

    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return {
      isValid: secureHash === signed,
      data: sortedParams,
    };
  }
}

module.exports = VNPay;