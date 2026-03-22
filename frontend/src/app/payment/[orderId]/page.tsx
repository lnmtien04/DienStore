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
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleVNPay = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/payment/vnpay`, {
        orderId,
        amount: 100000, // cần lấy từ đơn hàng
        orderInfo: `Thanh toán đơn hàng ${orderId}`,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Redirect đến URL thanh toán VNPay
      window.location.href = res.data.paymentUrl;
    } catch (error) {
      toast.error('Không thể tạo thanh toán');
      setLoading(false);
    }
  };

  // Nếu phương thức là COD, không cần thanh toán online
  // Trang này chỉ hiển thị nếu đơn hàng chưa thanh toán và phương thức online

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Thanh toán đơn hàng</h1>
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