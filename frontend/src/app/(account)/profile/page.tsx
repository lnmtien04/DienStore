'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';
import axios from 'axios';
import {
  ClockIcon as ClockSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  TruckIcon as TruckSolid,
  CheckCircleIcon as CheckCircleSolid,
  StarIcon as StarSolid,
  Cog6ToothIcon,
  ShoppingCartIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/solid';

interface Order {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
  items: any[];
}

export default function AccountDashboardPage() {
  const { user, token } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [needReviewCount, setNeedReviewCount] = useState(0);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!user || !token) return;
    fetchOrders();
    fetchNeedReviewCount();
  }, [user, token]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.orders || res.data);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNeedReviewCount = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/need-review-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNeedReviewCount(res.data.count);
    } catch (error) {
      console.error('Lỗi lấy số cần đánh giá:', error);
    }
  };

  const avatarUrl = user?.avatar?.startsWith('http') 
    ? user.avatar 
    : `${API_URL}${user?.avatar}`;

  const orderCounts = {
    pending: orders.filter(o => o.orderStatus === 'pending').length,
    confirmed: orders.filter(o => o.orderStatus === 'confirmed').length,
    shipping: orders.filter(o => o.orderStatus === 'shipping').length,
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
  };

  const statusItems = [
    { label: 'Chờ xác nhận', icon: ClockSolid, count: orderCounts.pending, href: '/orders/status/pending' },
    { label: 'Chờ lấy hàng', icon: ShoppingBagSolid, count: orderCounts.confirmed, href: '/orders/status/confirmed' },
    { label: 'Chờ giao hàng', icon: TruckSolid, count: orderCounts.shipping, href: '/orders/status/shipping' },
    { label: 'Đã giao', icon: CheckCircleSolid, count: orderCounts.delivered, href: '/orders/status/delivered' },
    { label: 'Đánh giá', icon: StarSolid, count: needReviewCount, href: '/orders/status/delivered' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Avatar và các nút chức năng */}
        {user && (
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-linear-to-r from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden shadow-md ring-2 ring-white dark:ring-gray-800">
                {user.avatar ? (
                  <img
                    src={avatarUrl}
                    alt={user.fullName || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {user.fullName?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.fullName}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-full shadow-md hover:shadow-lg transition hover:bg-blue-100 dark:hover:bg-blue-800"
              >
                <Cog6ToothIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </Link>
              <Link
                href="/cart"
                className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-full shadow-md hover:shadow-lg transition hover:bg-blue-100 dark:hover:bg-blue-800"
              >
                <ShoppingCartIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </Link>
              <Link
                href="/chat"
                className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-full shadow-md hover:shadow-lg transition hover:bg-blue-100 dark:hover:bg-blue-800"
              >
                <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </Link>
            </div>
          </div>
        )}
                  
        {/* Phần Đơn mua */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn mua</h2>
            <Link
              href="/HistoryOrders"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              Xem lịch sử mua hàng <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : (
            <div className="flex justify-between gap-2">
              {statusItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex-1 flex flex-col items-center text-center group min-w-0"
                >
                  <div className="relative inline-flex items-center justify-center">
                    <item.icon className="w-10 h-10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                    {item.count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                        {item.count}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white mt-2 truncate w-full px-1">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}