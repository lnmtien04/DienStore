'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CubeIcon,
  UsersIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    orderStatus: string;
    createdAt: string;
    user: { fullName: string };
  }[];
  dailyRevenue?: { date: string; revenue: number }[]; // dữ liệu biểu đồ
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days'); // 'today', '7days', '30days', 'custom'
  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchStats();
  }, [token, timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range: timeRange });
      const res = await axios.get(`${API_URL}/api/dashboard?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (error) {
      console.error('Lỗi tải dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Chờ xử lý' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Đã xác nhận' },
      shipping: { bg: 'bg-purple-100', text: 'text-purple-600', label: 'Đang giao' },
      delivered: { bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Đã giao' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-600', label: 'Đã hủy' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Hoàn thành' },
    };
    const { bg, text, label } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const handleExport = () => {
    // Giả lập xuất Excel, có thể gọi API export
    if (stats?.recentOrders.length) {
      // Tạo CSV đơn giản
      const csvContent = [
        ['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày tạo'],
        ...stats.recentOrders.map(order => [
          order.orderNumber,
          order.user?.fullName || 'N/A',
          order.totalAmount.toString(),
          order.orderStatus,
          new Date(order.createdAt).toLocaleDateString('vi-VN'),
        ]),
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `dashboard_orders_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
    } else {
      alert('Không có dữ liệu để xuất');
    }
  };

  if (loading) return <div className="text-center py-10 text-slate-500">Đang tải...</div>;

  // Dữ liệu mẫu cho biểu đồ nếu API chưa trả về
  const chartData = stats?.dailyRevenue || [
    { date: '01/03', revenue: 12000000 },
    { date: '02/03', revenue: 15000000 },
    { date: '03/03', revenue: 18000000 },
    { date: '04/03', revenue: 22000000 },
    { date: '05/03', revenue: 25000000 },
    { date: '06/03', revenue: 21000000 },
    { date: '07/03', revenue: 28000000 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      {/* Header + Bộ lọc + Xuất Excel */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          {/* Dropdown lọc thời gian */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="custom">Tùy chọn</option>
          </select>
          {/* Nút xuất Excel */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* 4 thẻ thống kê */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <StatCard
              name="Tổng đơn hàng"
              value={stats.totalOrders}
              icon={ShoppingCartIcon}
              change="+12%"
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              name="Doanh thu"
              value={formatCurrency(stats.totalRevenue)}
              icon={CurrencyDollarIcon}
              change="+23%"
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <StatCard
              name="Sản phẩm"
              value={stats.totalProducts}
              icon={CubeIcon}
              change="+5%"
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
            <StatCard
              name="Khách hàng"
              value={stats.totalCustomers}
              icon={UsersIcon}
              change="+18%"
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
          </div>

          {/* Biểu đồ doanh thu */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Doanh thu theo ngày</h2>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value: any) => {
                      if (typeof value === 'number') return formatCurrency(value);
                      return value;
                    }}
                    labelFormatter={(label) => `Ngày: ${label}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bảng đơn hàng gần đây */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Đơn hàng gần đây</h2>
              <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
                Xem tất cả
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã đơn</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Khách hàng</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng tiền</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{order.orderNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{order.user?.fullName || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(order.orderStatus)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <Link href={`/admin/orders/${order._id}`} className="text-blue-600 hover:underline">
                          Xem
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stats.recentOrders.length === 0 && (
              <p className="text-center py-4 text-slate-500">Chưa có đơn hàng nào</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Component thẻ thống kê với màu sắc tùy chỉnh
const StatCard = ({ name, value, icon: Icon, change, iconBg, iconColor }: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 transition hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 mb-1">{name}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-emerald-600 mt-1">{change}</p>
      </div>
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  </div>
);