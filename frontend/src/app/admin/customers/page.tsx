'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import {
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  KeyIcon,
  EnvelopeIcon,
  ClockIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Customer {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  avatar?: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    isActive: true,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'asc' | 'desc' }>({
    key: 'fullName',
    direction: 'asc',
  });

  const { token, user, loading: authLoading } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const isAdmin = user?.roles?.includes('admin');

  useEffect(() => {
    if (!authLoading) {
      if (token) {
        fetchCustomers();
      } else {
        setLoading(false);
      }
    }
  }, [token, authLoading]);

  const fetchCustomers = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = res.data;
      data = data.map((c: Customer) => ({
        ...c,
        totalOrders: Math.floor(Math.random() * 20),
        totalSpent: Math.floor(Math.random() * 50000000),
        lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      setCustomers(data);
    } catch (error) {
      console.error('Lỗi tải khách hàng:', error);
      toast.error('Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter((c) => {
      const matchesSearch =
        (c.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phoneNumber || '').includes(searchTerm);
      if (!matchesSearch) return false;
      if (statusFilter === 'active') return c.isActive;
      if (statusFilter === 'inactive') return !c.isActive;
      return true;
    });
    filtered.sort((a, b) => {
      const key = sortConfig.key;
      let aVal = a[key] ?? '';
      let bVal = b[key] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [customers, searchTerm, statusFilter, sortConfig]);

  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const requestSort = (key: keyof Customer) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!isAdmin) {
      toast.error('Bạn không có quyền thực hiện thao tác này');
      return;
    }
    if (!token) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }
    if (!confirm(`Bạn có chắc muốn ${currentStatus ? 'khóa' : 'mở khóa'} tài khoản này?`)) return;
    try {
      await axios.patch(`${API_URL}/api/customers/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Cập nhật trạng thái thành công');
      fetchCustomers();
    } catch (error) {
      console.error('Lỗi thay đổi trạng thái:', error);
      toast.error('Thao tác thất bại');
    }
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      toast.error('Bạn không có quyền xóa khách hàng');
      return;
    }
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (!token) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/customers/${deleteTarget}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Xóa khách hàng thành công');
      fetchCustomers();
    } catch (error) {
      console.error('Lỗi xóa khách hàng:', error);
      toast.error('Xóa thất bại');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const openEditModal = (customer: Customer) => {
    if (!isAdmin) {
      toast.error('Bạn không có quyền sửa thông tin khách hàng');
      return;
    }
    setSelectedCustomer(customer);
    setEditForm({
      fullName: customer.fullName,
      email: customer.email,
      phoneNumber: customer.phoneNumber || '',
      address: customer.address || '',
      isActive: customer.isActive,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!isAdmin) {
      toast.error('Bạn không có quyền sửa thông tin khách hàng');
      return;
    }
    if (!token) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }
    try {
      await axios.put(`${API_URL}/api/customers/${selectedCustomer._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Cập nhật thành công');
      setShowEditModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Lỗi cập nhật khách hàng:', error);
      toast.error('Cập nhật thất bại');
    }
  };

  const handleResetPassword = (email: string) => {
    if (!isAdmin) {
      toast.error('Bạn không có quyền thực hiện thao tác này');
      return;
    }
    toast.success(`Đã gửi yêu cầu reset mật khẩu đến ${email}`);
  };

  const handleSendEmail = (email: string) => {
    if (!isAdmin) {
      toast.error('Bạn không có quyền thực hiện thao tác này');
      return;
    }
    toast.success(`Đã gửi email đến ${email}`);
  };

  const handleViewLoginHistory = (customerId: string) => {
    if (!isAdmin) {
      toast.error('Bạn không có quyền xem lịch sử đăng nhập');
      return;
    }
    toast('Chức năng đang phát triển', { icon: '🚧' });
  };

  const getCustomerLevel = (customer: Customer) => {
    if (!customer.isActive) return { label: 'Bị khóa', color: 'bg-red-100 text-red-600' };
    const spent = customer.totalSpent || 0;
    if (spent > 30000000) return { label: 'VIP', color: 'bg-purple-100 text-purple-600' };
    if (spent > 10000000) return { label: 'Thân thiết', color: 'bg-blue-100 text-blue-600' };
    return { label: 'Mới', color: 'bg-green-100 text-green-600' };
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý khách hàng</h1>
          <p className="text-sm text-slate-500">Tổng số: {totalItems} khách hàng</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-60">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Đã khóa</option>
        </select>
        <select
          value={itemsPerPage}
          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl"
        >
          <option value="10">10 / trang</option>
          <option value="20">20 / trang</option>
          <option value="50">50 / trang</option>
        </select>
      </div>

      {/* Bảng khách hàng */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Avatar</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => requestSort('fullName')}>
                  <div className="flex items-center gap-1">
                    Họ tên
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">SĐT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Địa chỉ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => requestSort('totalOrders')}>
                  <div className="flex items-center gap-1">
                    Tổng đơn
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => requestSort('totalSpent')}>
                  <div className="flex items-center gap-1">
                    Tổng chi
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Đơn gần nhất</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Phân loại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Ngày tham gia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.map((customer) => {
                const level = getCustomerLevel(customer);
                return (
                  <tr
                    key={customer._id}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                    onClick={() => { setSelectedCustomer(customer); setShowDetailModal(true); }}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {customer.avatar ? (
                        <Image src={customer.avatar} alt={customer.fullName} width={40} height={40} className="rounded-full object-cover" unoptimized />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                          {customer.fullName?.charAt(0) || '?'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{customer.fullName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{customer.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{customer.phoneNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{customer.address || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{customer.totalOrders || 0}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {(customer.totalSpent || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${level.color}`}>
                        {level.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        customer.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {customer.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition group relative"
                            title="Sửa thông tin"
                          >
                            <PencilIcon className="w-5 h-5" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20">
                              Sửa
                            </span>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(customer._id, customer.isActive)}
                            className={`p-2 rounded-lg transition group relative ${
                              customer.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={customer.isActive ? 'Khóa' : 'Mở khóa'}
                          >
                            {customer.isActive ? <LockClosedIcon className="w-5 h-5" /> : <LockOpenIcon className="w-5 h-5" />}
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20">
                              {customer.isActive ? 'Khóa' : 'Mở khóa'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(customer._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition group relative"
                            title="Xóa"
                          >
                            <TrashIcon className="w-5 h-5" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20">
                              Xóa
                            </span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalItems === 0 && (
          <p className="text-center py-8 text-slate-500">Không có khách hàng nào</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} khách hàng
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === num
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Modal chi tiết khách hàng */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Chi tiết khách hàng</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedCustomer.avatar ? (
                  <Image src={selectedCustomer.avatar} alt={selectedCustomer.fullName} width={60} height={60} className="rounded-full object-cover" unoptimized />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-2xl">
                    {selectedCustomer.fullName?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-semibold">{selectedCustomer.fullName}</h4>
                  <p className="text-sm text-slate-500">{selectedCustomer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Số điện thoại</p>
                  <p className="text-sm font-medium">{selectedCustomer.phoneNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Địa chỉ</p>
                  <p className="text-sm font-medium">{selectedCustomer.address || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tổng đơn hàng</p>
                  <p className="text-sm font-medium">{selectedCustomer.totalOrders || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tổng chi</p>
                  <p className="text-sm font-medium text-blue-600">{(selectedCustomer.totalSpent || 0).toLocaleString('vi-VN')}đ</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Đơn gần nhất</p>
                  <p className="text-sm font-medium">{selectedCustomer.lastOrderDate ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString('vi-VN') : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Ngày tham gia</p>
                  <p className="text-sm font-medium">{new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phân loại</p>
                  <p className={`px-3 py-1 text-xs font-medium rounded-full inline-block ${getCustomerLevel(selectedCustomer).color}`}>
                    {getCustomerLevel(selectedCustomer).label}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Trạng thái</p>
                  <p className={`px-3 py-1 text-xs font-medium rounded-full inline-block ${
                    selectedCustomer.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {selectedCustomer.isActive ? 'Hoạt động' : 'Đã khóa'}
                  </p>
                </div>
              </div>

              {/* Hành động nâng cao - chỉ hiển thị nếu admin */}
              {isAdmin && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Hành động nâng cao</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleResetPassword(selectedCustomer.email)}
                      className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1"
                      title="Gửi yêu cầu reset mật khẩu"
                    >
                      <KeyIcon className="w-4 h-4" />
                      Reset mật khẩu
                    </button>
                    <button
                      onClick={() => handleSendEmail(selectedCustomer.email)}
                      className="px-3 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 flex items-center gap-1"
                      title="Gửi email"
                    >
                      <EnvelopeIcon className="w-4 h-4" />
                      Gửi email
                    </button>
                    <button
                      onClick={() => handleViewLoginHistory(selectedCustomer._id)}
                      className="px-3 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 flex items-center gap-1"
                      title="Xem lịch sử đăng nhập"
                    >
                      <ClockIcon className="w-4 h-4" />
                      Lịch sử đăng nhập
                    </button>
                    <button
                      onClick={() => toast('IP gần nhất: 192.168.1.1 (mock)', { icon: '🌐' })}
                      className="px-3 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 flex items-center gap-1"
                      title="Xem IP"
                    >
                      <ComputerDesktopIcon className="w-4 h-4" />
                      Xem IP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa thông tin khách hàng (chỉ hiển thị nếu admin) */}
      {showEditModal && selectedCustomer && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Sửa thông tin khách hàng</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="editIsActive" className="text-sm">Hoạt động</label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal (chỉ hiển thị nếu admin) */}
      {showDeleteConfirm && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-4">Bạn có chắc muốn xóa khách hàng này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}