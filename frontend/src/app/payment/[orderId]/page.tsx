'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const { orderId } = useParams();
  const { token } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (orderId && token) fetchOrder();
  }, [orderId, token]);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Order data:', res.data);
      setOrder(res.data);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
      toast.error('Không thể tải thông tin đơn hàng');
      router.push('/cart');
    }
  };

  const handleVNPay = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const amount = order.totalAmount || order.totalPrice || 0;
      console.log('💰 Amount to pay:', amount);
      if (amount <= 0) {
        toast.error('Số tiền thanh toán không hợp lệ');
        setLoading(false);
        return;
      }
      const res = await axios.post(`${API_URL}/api/payment/vnpay`, {
        orderId: order._id,
        amount,
        orderInfo: `Thanh toán đơn hàng ${order.orderNumber}`,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = res.data.paymentUrl;
    } catch (error: any) {
      console.error('Lỗi tạo thanh toán:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo thanh toán');
      setLoading(false);
    }
  };

  if (!order) return <div className="text-center py-10">Đang tải...</div>;

  const total = order.totalAmount || order.totalPrice || 0;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Thanh toán đơn hàng</h1>
      <div className="mb-4">
        <p className="text-gray-600">Đơn hàng: {order.orderNumber}</p>
        <p className="text-xl font-semibold text-red-600">
          Tổng tiền: {total.toLocaleString('vi-VN')}đ
        </p>
      </div>
      <button
        onClick={handleVNPay}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Đang xử lý...' : 'Thanh toán qua VNPay'}
      </button>
    </div>
  );
}