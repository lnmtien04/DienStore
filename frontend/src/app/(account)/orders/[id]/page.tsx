'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ClockIcon,
  CubeIcon,
  TruckIcon,
  CheckCircleIcon,
  XMarkIcon,
  StarIcon,
  ShoppingCartIcon,
  MapPinIcon,
  CreditCardIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

interface Order {
  _id: string;
  orderNumber: string;
  user: any;
  items: any[];
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city?: string;
    district?: string;
    ward?: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  receivedAt?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
}

const statusSteps = [
  { key: 'pending', label: 'Chờ xác nhận', icon: ClockIcon },
  { key: 'confirmed', label: 'Chờ lấy hàng', icon: CubeIcon },
  { key: 'shipping', label: 'Chờ giao hàng', icon: TruckIcon },
  { key: 'delivered', label: 'Đã giao', icon: CheckCircleIcon },
];

export default function OrderDetailPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
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
  }, [token, id]);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
      toast.error('Không thể tải thông tin đơn hàng');
      router.push('/account/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    try {
      await axios.patch(`${API_URL}/api/orders/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Đã hủy đơn hàng');
      fetchOrder();
    } catch (error) {
      toast.error('Hủy đơn thất bại');
    }
  };

  const handleConfirmReceived = async () => {
    try {
      await axios.patch(`${API_URL}/api/orders/${id}/receive`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Cảm ơn bạn đã xác nhận!');
      fetchOrder();
    } catch (error) {
      toast.error('Xác nhận thất bại');
    }
  };

  const getStepStatus = (stepKey: string) => {
    if (!order) return 'pending';
    const statusOrder = ['pending', 'confirmed', 'shipping', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.orderStatus);
    const stepIndex = statusOrder.indexOf(stepKey);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        {[1,2,3].map(i => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!order) return null;

  const paymentMethodLabel = {
    cod: 'Thanh toán khi nhận hàng',
    bank_transfer: 'Chuyển khoản',
    momo: 'Ví MoMo',
    zalopay: 'ZaloPay',
  }[order.paymentMethod] || order.paymentMethod;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Chi tiết đơn hàng #{order.orderNumber}
        </h1>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Trạng thái đơn hàng</h2>
        <div className="relative flex justify-between">
          {statusSteps.map((step, index) => {
            const status = getStepStatus(step.key);
            const Icon = step.icon;
            const isActive = status === 'active';
            const isCompleted = status === 'completed';
            return (
              <div key={step.key} className="flex-1 text-center relative z-10">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-blue-600 text-white' :
                    'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircleSolid className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-blue-600 dark:text-blue-400' :
                    isCompleted ? 'text-green-600 dark:text-green-400' :
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
          {/* Đường kẻ nối */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
        </div>
        {order.orderStatus === 'cancelled' && (
          <p className="mt-4 text-red-600 flex items-center gap-2">
            <XMarkIcon className="w-5 h-5" />
            Đơn hàng đã bị hủy vào {new Date(order.cancelledAt!).toLocaleString('vi-VN')}
          </p>
        )}
      </div>

      {/* Thông tin giao hàng */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPinIcon className="w-5 h-5" /> Thông tin giao hàng
        </h2>
        <p><span className="font-medium">Người nhận:</span> {order.shippingAddress.fullName}</p>
        <p><span className="font-medium">SĐT:</span> {order.shippingAddress.phone}</p>
        <p><span className="font-medium">Địa chỉ:</span> {order.shippingAddress.address}</p>
        {(order.shippingAddress.city || order.shippingAddress.district || order.shippingAddress.ward) && (
          <p>{order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}</p>
        )}
        {order.shippingCarrier && order.trackingNumber && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm"><span className="font-medium">Đơn vị vận chuyển:</span> {order.shippingCarrier}</p>
            <p className="text-sm"><span className="font-medium">Mã vận đơn:</span> {order.trackingNumber}</p>
            <a
              href={`https://tracking.example.com/${order.trackingNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              Theo dõi vận đơn →
            </a>
          </div>
        )}
      </div>

      {/* Sản phẩm */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Sản phẩm đã đặt</h2>
        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-4 border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
              <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                {item.variant && <p className="text-sm text-gray-500">Phân loại: {item.variant}</p>}
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm">{item.price.toLocaleString('vi-VN')}đ × {item.quantity}</p>
                  <p className="font-semibold">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4 text-lg">
          <span className="font-medium">Tổng cộng:</span>
          <span className="ml-2 font-bold text-blue-600">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {/* Thanh toán */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5" /> Thanh toán
        </h2>
        <p><span className="font-medium">Phương thức:</span> {paymentMethodLabel}</p>
        <p><span className="font-medium">Trạng thái:</span> {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
        {order.notes && (
          <p className="mt-2"><span className="font-medium">Ghi chú:</span> {order.notes}</p>
        )}
      </div>
         
{order.paymentStatus !== 'paid' && order.paymentMethod !== 'cod' && (
  <Link
    href={`/payment/${order._id}`}
    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  >
    Thanh toán ngay
  </Link>
)}


{order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && (
  <p className="text-yellow-600"></p>
)}
      {/* Nút hành động */}
      <div className="flex flex-wrap gap-3 justify-end">
        {order.orderStatus === 'pending' && (
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Hủy đơn hàng
          </button>
        )}
        {order.orderStatus === 'delivered' && !order.receivedAt && (
          <button
            onClick={handleConfirmReceived}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Đã nhận được hàng
          </button>
        )}
        {order.orderStatus === 'delivered' && (
          <>
            <button
              onClick={() => router.push(`/account/orders/${id}/review`)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <StarIcon className="w-5 h-5 inline mr-1" />
              Đánh giá
            </button>
            <button
              onClick={() => {/* mua lại */}}
              className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 transition"
            >
              <ShoppingCartIcon className="w-5 h-5 inline mr-1" />
              Mua lại
            </button>
          </>
        )}
        {order.orderStatus === 'shipping' && order.trackingNumber && (
          <a
            href={`https://tracking.example.com/${order.trackingNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Theo dõi đơn hàng
          </a>
        )}
      </div>
    </div>
  );
}