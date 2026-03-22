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
  StarIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const statusConfig = {
  pending: { label: 'Chờ xác nhận', icon: ClockIcon, color: 'yellow' },
  confirmed: { label: 'Chờ lấy hàng', icon: CubeIcon, color: 'orange' },
  shipping: { label: 'Chờ giao hàng', icon: TruckIcon, color: 'blue' },
  delivered: { label: 'Đã giao', icon: CheckCircleIcon, color: 'blue' }, // tạm thời, sẽ override
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

  const handlePayment = async (orderId: string, amount: number) => {
    try {
      const res = await axios.post(`${API_URL}/api/payment/vnpay`, {
        orderId,
        amount,
        orderInfo: `Thanh toán đơn hàng`,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = res.data.paymentUrl;
    } catch (error) {
      toast.error('Không thể tạo thanh toán');
    }
  };

  const handleConfirmReceive = async (orderId: string) => {
    // Popup xác nhận
    const confirmed = window.confirm(
      'Bạn đã nhận được hàng?\n\nSau khi xác nhận, bạn sẽ không thể khiếu nại hoàn tiền. Đơn hàng sẽ được hoàn tất.'
    );
    if (!confirmed) return;

    try {
      const res = await axios.patch(`${API_URL}/api/orders/${orderId}/receive`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Cảm ơn bạn đã xác nhận!');
      fetchOrders(); // Tải lại danh sách
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xác nhận thất bại');
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
             console.log({
    orderId: order._id,
    orderStatus: order.orderStatus,
    receivedAt: order.receivedAt,
    isDelivered: status === 'delivered',
    isCompleted: !!order.receivedAt,
    showButton: (status === 'delivered') && !order.receivedAt
  });
            const firstItem = order.items[0];
            const otherCount = order.items.length - 1;
            const isPending = status === 'pending';
            const isDelivered = status === 'delivered';
            const isCompleted = order.receivedAt; // đã xác nhận nhận hàng

            // Xác định badge chính và badge phụ
            let mainBadge = { label: config.label, icon: config.icon, color: config.color };
            let subBadge = null;

            if (isDelivered && !isCompleted) {
              // Đã giao nhưng chưa xác nhận
              mainBadge = { label: 'Đã giao', icon: CheckCircleIcon, color: 'blue' };
              subBadge = { label: 'Chờ xác nhận', icon: ClockIcon, color: 'yellow' };
            } else if (isDelivered && isCompleted) {
              // Đã hoàn thành
              mainBadge = { label: 'Hoàn thành', icon: CheckCircleSolid, color: 'green' };
            }

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
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-${mainBadge.color}-100 text-${mainBadge.color}-700`}>
                      <mainBadge.icon className="w-4 h-4" />
                      {mainBadge.label}
                    </span>
                    {subBadge && (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-${subBadge.color}-100 text-${subBadge.color}-700`}>
                        <subBadge.icon className="w-4 h-4" />
                        {subBadge.label}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                {/* Thông tin thanh toán và nút xác nhận (cho delivered chưa completed) */}
                {isDelivered && !isCompleted && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                      Phương thức thanh toán:{' '}
                      <span className="font-medium">
                        {order.paymentMethod === 'cod'
                          ? 'Thanh toán khi nhận hàng'
                          : order.paymentMethod === 'vnpay'
                          ? 'VNPay'
                          : order.paymentMethod === 'momo'
                          ? 'Ví MoMo'
                          : 'Chuyển khoản'}
                      </span>
                    </p>
                    <p className={order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
  Trạng thái thanh toán: {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
</p>
                  </div>
                )}

                {/* Nút hành động */}
                <div className="flex justify-end gap-2 mt-4 flex-wrap">
                  {/* Nút Hủy đơn (chỉ pending) */}
                  {isPending && (
                    <button
                      onClick={() => handleCancel(order._id)}
                      className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Hủy đơn
                    </button>
                  )}

                  {/* Nút Thanh toán online (chỉ pending, phương thức online, chưa thanh toán) */}
                  {order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid' && status === 'pending' && (
                    <button
                      onClick={() => handlePayment(order._id, order.totalAmount)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Thanh toán
                    </button>
                  )}

                  {/* Nút Xác nhận đã nhận hàng (chỉ delivered và chưa completed) */}
                  {isDelivered && !isCompleted && (
                    <button
                      onClick={() => handleConfirmReceive(order._id)}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md"
                    >
                      <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                      Xác nhận đã nhận hàng
                    </button>
                  )}

                  {/* Nút Đánh giá và Mua lại (khi đã hoàn thành) */}
                  {isCompleted && (
                    <>
                      {order.reviewed ? (
                        <span className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg flex items-center gap-1">
                          <StarIcon className="w-4 h-4" />
                          Đã đánh giá
                        </span>
                      ) : (
                        <Link
                          href={`/orders/${order._id}/review`}
                          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                        >
                          <StarIcon className="w-4 h-4" />
                          Đánh giá
                        </Link>
                      )}
                      <button
                        onClick={() => handleReorder(order)}
                        className="px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 flex items-center gap-1"
                      >
                        <ShoppingCartIcon className="w-4 h-4" />
                        Mua lại
                      </button>
                    </>
                  )}

                  {/* Nút Xem chi tiết (luôn có) */}
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