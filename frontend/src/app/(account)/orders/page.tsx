'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  CubeIcon,
  TruckIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ChatBubbleLeftEllipsisIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const statusConfig = {
  pending: {
    label: 'Chờ xác nhận',
    icon: ClockIcon,
    color: 'yellow',
    allowCancel: true,
    message: 'Đơn hàng của bạn đã được ghi nhận và đang chờ cửa hàng xác nhận.',
  },
  confirmed: {
    label: 'Chờ lấy hàng',
    icon: CubeIcon,
    color: 'orange',
    allowCancel: false,
    message: 'Cửa hàng đã xác nhận đơn hàng của bạn. Đang chuẩn bị và chờ đơn vị vận chuyển đến lấy.',
  },
  shipping: {
    label: 'Chờ giao hàng',
    icon: TruckIcon,
    color: 'blue',
    allowCancel: false,
    message: 'Đơn hàng đã được bàn giao cho đơn vị vận chuyển.',
  },
  delivered: {
    label: 'Đã giao',
    icon: CheckCircleIcon,
    color: 'green',
    allowCancel: false,
    message: 'Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua sắm!',
  },
};

export default function OrdersByStatusPage() {
  const { status } = useParams();
  const { token } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const config = statusConfig[status as keyof typeof statusConfig];

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    if (!config) {
      router.push('/orders');
      return;
    }
    fetchOrders();
  }, [token, status]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/orders?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || res.data);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
      toast.error('Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    try {
      await axios.patch(`${API_URL}/api/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Đã hủy đơn hàng');
      fetchOrders();
    } catch (error) {
      toast.error('Hủy đơn thất bại');
    }
  };

  const handleReorder = async (order: any) => {
    try {
      for (const item of order.items) {
        await axios.post(`${API_URL}/api/cart/add`, {
          productId: item.product?._id || item.product,
          quantity: item.quantity,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
      router.push('/cart');
    } catch (error) {
      console.error('Lỗi mua lại:', error);
      toast.error('Không thể thêm sản phẩm vào giỏ');
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-center">Đang tải...</div>;
  }

  if (!config) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Đơn hàng {config.label}</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Không có đơn hàng nào.</p>
          <Link href="/products" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const firstItem = order.items[0];
            const otherCount = order.items.length - 1;
            return (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                {/* Sản phẩm đầu tiên */}
                <div className="flex gap-3">
                  <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                    {firstItem?.image && (
                      <Image src={firstItem.image} alt={firstItem.name} fill className="object-cover" unoptimized />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{firstItem.name}</h4>
                    {firstItem.variant && <p className="text-xs text-gray-500">Phân loại: {firstItem.variant}</p>}
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm">{firstItem.price.toLocaleString('vi-VN')}đ × {firstItem.quantity}</p>
                      <p className="text-sm font-semibold">{(firstItem.price * firstItem.quantity).toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                </div>

                {/* Các sản phẩm khác */}
                {otherCount > 0 && (
                  <p className="text-xs text-gray-500 mt-2">+ {otherCount} sản phẩm khác</p>
                )}

                {/* Tổng tiền */}
                <div className="flex justify-end mt-2 text-sm">
                  <span className="font-medium">Tổng cộng:</span>
                  <span className="ml-2 font-bold text-blue-600">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>

                {/* Badge trạng thái và thời gian */}
                <div className="flex items-center justify-between mt-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-${config.color}-100 text-${config.color}-700`}>
                    <config.icon className="w-4 h-4" />
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                {/* Thông báo động cho từng trạng thái */}
                {status === 'confirmed' && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <p>{config.message}</p>
                  </div>
                )}

                {/* Hiển thị mã vận đơn cho trạng thái shipping */}
                {status === 'shipping' && order.trackingNumber && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Mã vận đơn:</span> {order.trackingNumber}
                  </div>
                )}

                {/* Hiển thị thời gian giao hàng nếu có (cho delivered) */}
                {status === 'delivered' && order.deliveredAt && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Đã giao lúc:</span> {new Date(order.deliveredAt).toLocaleString('vi-VN')}
                  </div>
                )}

                {/* Nút hành động */}
                <div className="flex justify-end gap-2 mt-4">
                  {config.allowCancel && (
                    <button
                      onClick={() => handleCancel(order._id)}
                      className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Hủy đơn
                    </button>
                  )}
                  {order.paymentStatus !== 'paid' && status !== 'delivered' && (
                    <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Thanh toán
                    </button>
                  )}
                  {/* Nút Liên hệ shop cho các trạng thái cần hỗ trợ */}
                  {(status === 'confirmed' || status === 'shipping') && (
                    <Link
                      href="/chat"
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                    >
                      <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                      Liên hệ
                    </Link>
                  )}
                  {/* Nút Theo dõi đơn cho shipping */}
                  {status === 'shipping' && order.trackingNumber && (
                    <a
                      href={`https://tracking.example.com/${order.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Theo dõi đơn
                    </a>
                  )}
                  {/* Nút Đánh giá và Mua lại cho delivered */}
                  {status === 'delivered' && (
                    <>
                      {order.reviewed ? (
                        <span className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg flex items-center gap-1">
                          <StarIcon className="w-4 h-4" />
                          Đã đánh giá
                        </span>
                      ) : (
                        <Link
                          href={`/orders/${order._id}/review`}
                          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Đánh giá
                        </Link>
                      )}
                      <button
                        onClick={() => handleReorder(order)}
                        className="px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        Mua lại
                      </button>
                    </>
                  )}
                  <Link
                    href={`/orders/${order._id}`}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}