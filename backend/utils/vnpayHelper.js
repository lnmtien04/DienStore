const crypto = require('crypto');

function sortObject(obj) {
    let sorted = {};
    Object.keys(obj).sort().forEach(key => { sorted[key] = obj[key]; });
    return sorted;
}

function buildSignData(params) {
    const sorted = sortObject(params);
    let signData = '';
    for (let key in sorted) {
        let value = sorted[key];
        if (value === null || value === undefined) continue;
        // Encode theo chuẩn VNPay: encodeURIComponent và thay %20 thành +
        let encoded = encodeURIComponent(value).replace(/%20/g, '+');
        signData += (signData ? '&' : '') + key + '=' + encoded;
    }
    return signData;
}

function createSecureHash(data, secretKey) {
    return crypto.createHmac('sha512', secretKey).update(data, 'utf-8').digest('hex');
}

module.exports = { sortObject, buildSignData, createSecureHash };