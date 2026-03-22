'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  items: {
    product: any;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  notes?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export default function OrderDetailPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { id } = useParams();
  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchOrder();
  }, [id, token]);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(res.data);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await axios.patch(`${API_URL}/api/orders/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrder();
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipping: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
    };
    return (
      <span className={`px-3 py-1 text-sm rounded-full ${colors[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (!order) return <div className="text-center py-10">Không tìm thấy đơn hàng</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Chi tiết đơn hàng #{order.orderNumber}</h1>
        <div className="ml-auto">
          {getStatusBadge(order.orderStatus)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Thông tin khách hàng */}
        <div className="bg-white p-4 rounded-lg shadow col-span-1">
          <h2 className="font-medium mb-3">Thông tin khách hàng</h2>
          <p className="text-sm"><span className="font-medium">Họ tên:</span> {order.user?.fullName}</p>
          <p className="text-sm"><span className="font-medium">Email:</span> {order.user?.email}</p>
          <p className="text-sm"><span className="font-medium">SĐT:</span> {order.user?.phone}</p>
        </div>

        {/* Thông tin giao hàng */}
        <div className="bg-white p-4 rounded-lg shadow col-span-1">
          <h2 className="font-medium mb-3">Địa chỉ giao hàng</h2>
          <p className="text-sm"><span className="font-medium">Người nhận:</span> {order.shippingAddress.fullName}</p>
          <p className="text-sm"><span className="font-medium">SĐT:</span> {order.shippingAddress.phone}</p>
          <p className="text-sm"><span className="font-medium">Địa chỉ:</span> {order.shippingAddress.address}</p>
          <p className="text-sm">{order.shippingAddress.city}, {order.shippingAddress.district}, {order.shippingAddress.ward}</p>
        </div>

        {/* Thông tin thanh toán */}
        <div className="bg-white p-4 rounded-lg shadow col-span-1">
          <h2 className="font-medium mb-3">Thanh toán</h2>
          <p className="text-sm"><span className="font-medium">Phương thức:</span> {order.paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản'}</p>
          <p className="text-sm"><span className="font-medium">Trạng thái:</span> {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
          <p className="text-sm"><span className="font-medium">Tổng tiền:</span> <span className="text-lg font-bold text-red-600">{order.totalAmount.toLocaleString()}đ</span></p>
          {/* Nút thanh toán online nếu chưa thanh toán và không phải COD */}
          {order.paymentStatus !== 'paid' && order.paymentMethod !== 'cod' && (
            <Link href={`/payment/${order._id}`}>
              <button className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Thanh toán online
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="font-medium mb-3">Sản phẩm đã đặt</h2>
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Sản phẩm</th>
              <th className="py-2 text-right">Đơn giá</th>
              <th className="py-2 text-right">Số lượng</th>
              <th className="py-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-2 flex items-center gap-2">
                  {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />}
                  <span>{item.name}</span>
                </td>
                <td className="py-2 text-right">{item.price.toLocaleString()}đ</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{(item.price * item.quantity).toLocaleString()}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ghi chú */}
      {order.notes && (
        <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm"><span className="font-medium">Ghi chú:</span> {order.notes}</p>
        </div>
      )}

      {/* Các nút cập nhật trạng thái */}
      <div className="mt-6 flex flex-wrap gap-3">
        {order.orderStatus === 'pending' && (
          <>
            <button
              onClick={() => updateStatus('confirmed')}
              disabled={updating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              Xác nhận đơn hàng
            </button>
            <button
              onClick={() => updateStatus('cancelled')}
              disabled={updating}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
            >
              Hủy đơn hàng
            </button>
          </>
        )}
        {order.orderStatus === 'confirmed' && (
          <button
            onClick={() => updateStatus('shipping')}
            disabled={updating}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300"
          >
            Chuyển sang giao hàng
          </button>
        )}
        {order.orderStatus === 'shipping' && (
          <button
            onClick={() => updateStatus('delivered')}
            disabled={updating}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
          >
            Xác nhận đã giao
          </button>
        )}
      </div>
    </div>
  );
}