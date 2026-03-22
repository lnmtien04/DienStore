'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { CalendarIcon, CurrencyDollarIcon, ShoppingBagIcon, UsersIcon } from '@heroicons/react/24/outline';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  todayOrders: number;
  todayRevenue: number;
  ordersByStatus: { _id: string; count: number }[];
}

interface RevenueData {
  _id: string;
  totalRevenue: number;
  orderCount: number;
}

interface TopProduct {
  _id: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function StatisticsPage() {
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [groupBy, setGroupBy] = useState('day');

  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchDashboard();
    fetchRevenue();
    fetchTopProducts();
  }, [token, dateRange, groupBy]);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/statistics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(res.data);
    } catch (error) {
      console.error('Lỗi tải dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/statistics/revenue?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&groupBy=${groupBy}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRevenueData(res.data);
    } catch (error) {
      console.error('Lỗi tải doanh thu:', error);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/statistics/top-products?limit=10&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTopProducts(res.data);
    } catch (error) {
      console.error('Lỗi tải sản phẩm bán chạy:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Thống kê báo cáo</h1>

      {/* Dashboard cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Tổng đơn hàng</p>
                <p className="text-2xl font-bold">{dashboard.totalOrders}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Hôm nay: {dashboard.todayOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Doanh thu</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboard.totalRevenue)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Hôm nay: {formatCurrency(dashboard.todayRevenue)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Sản phẩm</p>
                <p className="text-2xl font-bold">{dashboard.totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Khách hàng</p>
                <p className="text-2xl font-bold">{dashboard.totalCustomers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bộ lọc thời gian */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Từ ngày</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Đến ngày</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nhóm theo</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="mt-1 px-3 py-2 border rounded-md"
            >
              <option value="day">Ngày</option>
              <option value="month">Tháng</option>
              <option value="year">Năm</option>
            </select>
          </div>
        </div>
      </div>

      {/* Biểu đồ doanh thu */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">Doanh thu theo thời gian</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip formatter={(value: number | undefined) => (value ?? 0).toLocaleString() + 'đ'} />
            <Line type="monotone" dataKey="totalRevenue" stroke="#8884d8" name="Doanh thu" />
            <Line type="monotone" dataKey="orderCount" stroke="#82ca9d" name="Số đơn" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ tròn trạng thái đơn hàng */}
        {dashboard && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Đơn hàng theo trạng thái</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboard.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry._id}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {dashboard.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top sản phẩm bán chạy */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Top sản phẩm bán chạy</h2>
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Sản phẩm</th>
                <th className="py-2 text-right">Số lượng</th>
                <th className="py-2 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, idx) => (
                <tr key={p._id} className="border-b">
                  <td className="py-2">{idx + 1}. {p.name}</td>
                  <td className="py-2 text-right">{p.totalQuantity}</td>
                  <td className="py-2 text-right">{formatCurrency(p.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}