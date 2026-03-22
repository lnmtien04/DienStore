'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { StarIcon, ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface Order {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
  items: {
    product: any;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
  reviewed?: boolean;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('30days');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch orders khi page, debouncedSearchTerm, dateFilter, fromDate, toDate thay đổi
  useEffect(() => {
    if (!token) return;
    // Reset page về 1 khi filter thay đổi
    setPage(1);
    fetchOrders(1);
  }, [token, debouncedSearchTerm, dateFilter, fromDate, toDate]);

  // Hàm fetchOrders nhận page trực tiếp
  const fetchOrders = async (pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '10');
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      if (dateFilter === '30days') {
        const from = new Date();
        from.setDate(from.getDate() - 30);
        params.append('fromDate', from.toISOString().split('T')[0]);
      } else if (dateFilter === '3months') {
        const from = new Date();
        from.setMonth(from.getMonth() - 3);
        params.append('fromDate', from.toISOString().split('T')[0]);
      } else if (dateFilter === 'custom' && fromDate && toDate) {
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      }

      const res = await axios.get(`${API_URL}/api/orders/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Lỗi tải lịch sử:', error);
      toast.error('Không thể tải lịch sử mua hàng');
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi bấm nút Lọc (có thể gọi ngay lập tức)
  const handleFilterClick = () => {
    setPage(1);
    // Gọi fetch ngay lập tức, bỏ qua debounce hiện tại
    fetchOrders(1);
  };

  // Xử lý khi chuyển trang
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchOrders(newPage);
  };

  const handleReorder = async (order: Order) => {
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
      toast.error('Không thể thêm sản phẩm');
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Lịch sử mua hàng</h1>
        <p className="text-center">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Lịch sử mua hàng</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-50">
            <label className="block text-sm font-medium mb-1">Tìm theo mã đơn</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập mã đơn..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium mb-1">Thời gian</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="30days">30 ngày gần đây</option>
              <option value="3months">3 tháng gần đây</option>
              <option value="custom">Tùy chọn</option>
            </select>
          </div>
          {dateFilter === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </>
          )}
          <div className="flex items-end">
            <button
              onClick={handleFilterClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Lọc
            </button>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Bạn chưa có đơn hàng nào đã hoàn thành.
          </p>
          <Link
            href="/products"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const firstItem = order.items[0];
              const otherCount = order.items.length - 1;
              return (
                <div
                  key={order._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold">Mã đơn: {order.orderNumber}</p>
                      <p className="text-sm text-gray-500">
                        Ngày mua: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Hoàn thành
                    </span>
                  </div>

                  <div className="flex gap-3 py-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                      {firstItem?.image && (
                        <Image
                          src={firstItem.image}
                          alt={firstItem.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{firstItem.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {firstItem.price.toLocaleString('vi-VN')}đ × {firstItem.quantity}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {(firstItem.price * firstItem.quantity).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>
                  </div>

                  {otherCount > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      + {otherCount} sản phẩm khác
                    </p>
                  )}

                  <div className="flex justify-end mt-3 text-lg">
                    <span className="font-medium">Tổng thanh toán:</span>
                    <span className="ml-2 font-bold text-blue-600">
                      {order.totalAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    {order.reviewed ? (
                      <span className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg flex items-center gap-1">
                        <StarSolid className="w-4 h-4" />
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
                      <ArrowPathIcon className="w-4 h-4" />
                      Mua lại
                    </button>
                    <Link
                      href={`/orders/${order._id}`}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-4 py-2">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}