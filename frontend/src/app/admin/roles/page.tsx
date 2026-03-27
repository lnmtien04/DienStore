'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

interface UserCounts {
  [roleName: string]: number;
}

type SortField = 'name' | 'userCount' | 'isActive' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [userCounts, setUserCounts] = useState<UserCounts>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: '',
    isActive: true,
  });

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { token, user } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const isAdmin = user?.roles?.includes('admin');
  const isStaff = user?.roles?.includes('staff');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    if (!isAdmin && !isStaff) {
      router.push('/');
      return;
    }
    fetchData();
  }, [token, user, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, countsRes] = await Promise.all([
        axios.get(`${API_URL}/api/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/accounts/count-by-role`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setRoles(rolesRes.data);
      setUserCounts(countsRes.data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn');
        router.push('/auth/login');
      } else {
        toast.error('Không thể tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên chức vụ');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p),
      isActive: formData.isActive,
    };

    try {
      if (editingRole) {
        await axios.put(`${API_URL}/api/roles/${editingRole._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Cập nhật chức vụ thành công!');
      } else {
        await axios.post(`${API_URL}/api/roles`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Thêm chức vụ thành công!');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Lỗi lưu role:', error);
      if (axios.isAxiosError(error) && error.response) {
        const message = error.response.data.message || 'Dữ liệu không hợp lệ';
        toast.error(message);
      } else {
        toast.error('Đã xảy ra lỗi, vui lòng thử lại');
      }
    }
  };

  const handleDelete = async (id: string, roleName: string) => {
    // Bảo vệ role admin
    if (roleName.toLowerCase() === 'admin') {
      toast.error('Không thể xóa role admin');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa chức vụ này?')) return;

    // Kiểm tra nếu role có người dùng
    if (userCounts[roleName] > 0) {
      toast.error(`Không thể xóa role "${roleName}" vì còn ${userCounts[roleName]} người dùng.`);
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Xóa chức vụ thành công!');
      fetchData();
    } catch (error) {
      console.error('Lỗi xóa role:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Không thể xóa');
      }
    }
  };

  const openEditModal = (role: Role) => {
    if (!isAdmin) return;
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions.join(', '),
      isActive: role.isActive,
    });
    setShowModal(true);
  };

  const resetModal = () => {
    if (!isAdmin) return;
    setEditingRole(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: '',
      isActive: true,
    });
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setEditingRole(null);
  };

  // Sắp xếp và lọc
  const filteredRoles = roles.filter((r) =>
    (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRoles = [...filteredRoles].sort((a, b) => {
    let aValue: any, bValue: any;
    if (sortField === 'name') {
      aValue = a.name;
      bValue = b.name;
    } else if (sortField === 'userCount') {
      aValue = userCounts[a.name] || 0;
      bValue = userCounts[b.name] || 0;
    } else if (sortField === 'isActive') {
      aValue = a.isActive ? 1 : 0;
      bValue = b.isActive ? 1 : 0;
    } else if (sortField === 'createdAt') {
      aValue = new Date(a.createdAt).getTime() || 0;
      bValue = new Date(b.createdAt).getTime() || 0;
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDownIcon className="inline h-4 w-4 ml-1" />
    );
  };

  // Tính tổng người dùng chỉ dựa trên các role hiển thị
  const totalUsers = roles.reduce((sum, role) => sum + (userCounts[role.name] || 0), 0);
  const activeRolesCount = roles.filter((r) => r.isActive).length;

  // Hàm định dạng ngày an toàn
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Chưa xác định';
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="p-4">
      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Tổng chức vụ</p>
          <p className="text-2xl font-semibold">{roles.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Đang hoạt động</p>
          <p className="text-2xl font-semibold">{activeRolesCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Tổng người dùng</p>
          <p className="text-2xl font-semibold">{totalUsers}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Quản lý chức vụ</h1>
        {isAdmin && (
          <button
            onClick={resetModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Thêm chức vụ
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm chức vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('name')}
              >
                Tên <SortIcon field="name" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mô tả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quyền
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('userCount')}
              >
                Số người <SortIcon field="userCount" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('isActive')}
              >
                Trạng thái <SortIcon field="isActive" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('createdAt')}
              >
                Ngày tạo <SortIcon field="createdAt" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRoles.map((r) => (
              <tr key={r._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {r.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {r.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {r.name.toLowerCase() === 'admin' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Tất cả quyền
                      </span>
                    ) : r.permissions.length > 0 ? (
                      <>
                        {r.permissions.slice(0, 3).map((perm, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {perm}
                          </span>
                        ))}
                        {r.permissions.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800" title={r.permissions.join(', ')}>
                            +{r.permissions.length - 3}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">Chưa có quyền</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {userCounts[r.name] || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      r.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {r.isActive ? 'Hoạt động' : 'Ẩn'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(r.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => openEditModal(r)}
                        className={`text-blue-600 hover:text-blue-900 mr-3 ${
                          r.name.toLowerCase() === 'admin' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={r.name.toLowerCase() === 'admin'}
                        title={
                          r.name.toLowerCase() === 'admin'
                            ? 'Không thể chỉnh sửa role admin'
                            : ''
                        }
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {r.name.toLowerCase() !== 'admin' && (
                        <button
                          onClick={() => handleDelete(r._id, r.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal thêm/sửa */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {editingRole ? 'Sửa chức vụ' : 'Thêm chức vụ mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chức vụ *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={editingRole?.name.toLowerCase() === 'admin'}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quyền (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={formData.permissions}
                  onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                  placeholder="view_products, edit_products, delete_products"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  * Gợi ý nâng cao: sau này có thể chuyển sang giao diện checkbox theo module.
                </p>
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-900">
                  Hoạt động
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={editingRole?.name.toLowerCase() === 'admin'}
                >
                  {editingRole ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}