const Order = require('../models/order');

const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const prefix = `ORD${year}${month}${day}`;
  
  const lastOrder = await Order.findOne({ orderNumber: new RegExp(`^${prefix}`) })
    .sort({ orderNumber: -1 });
  
  let seq = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.slice(-5));
    seq = lastSeq + 1;
  }
  const seqStr = seq.toString().padStart(5, '0');
  return `${prefix}${seqStr}`;
};

module.exports = { generateOrderNumber };