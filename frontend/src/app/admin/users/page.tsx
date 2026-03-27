'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Role {
  _id: string;
  name: string;
}

interface Account {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roles: string[];
  isActive: boolean;
  username?: string;
  avatar?: string;
}

export default function UsersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: '',
    isActive: true,
    phoneNumber: '',
    username: '',
  });
  const { token, user } = useUser();
  const isAdmin = user?.roles?.includes('admin');

  useEffect(() => {
    if (token) {
      fetchAccounts();
      fetchRoles();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(res.data);
    } catch (error) {
      console.error('Lỗi tải người dùng:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(res.data);
    } catch (error) {
      console.error('Lỗi tải chức vụ:', error);
      toast.error('Không thể tải danh sách chức vụ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let method: 'post' | 'put' = 'post';
      let url = `${API_URL}/api/accounts`;
      if (editingAccount) {
        url = `${API_URL}/api/accounts/${editingAccount._id}`;
        method = 'put';
      }

      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        roles: [formData.role],
        isActive: formData.isActive,
      };
      if (formData.username) payload.username = formData.username;

      if (!editingAccount) {
        if (!formData.password) {
          toast.error('Vui lòng nhập mật khẩu');
          return;
        }
        payload.password = formData.password;
      } else {
        if (formData.password && formData.password.trim() !== '') {
          payload.password = formData.password;
        }
      }

      await axios({
        method,
        url,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(editingAccount ? 'Cập nhật thành công' : 'Thêm người dùng thành công');
      fetchAccounts();
      setShowModal(false);
      setEditingAccount(null);
      resetForm();
    } catch (error: any) {
      console.error('Lỗi lưu:', error);
      const message = error.response?.data?.message || error.message || 'Lỗi lưu dữ liệu';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    try {
      await axios.delete(`${API_URL}/api/accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Xóa người dùng thành công');
      fetchAccounts();
    } catch (error: any) {
      console.error('Xóa thất bại:', error);
      toast.error(error.response?.data?.message || 'Xóa thất bại');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: '',
      isActive: true,
      phoneNumber: '',
      username: '',
    });
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      fullName: account.fullName,
      email: account.email,
      password: '',
      role: account.roles?.[0] || '',
      isActive: account.isActive,
      phoneNumber: account.phoneNumber || '',
      username: account.username || '',
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingAccount(null);
    resetForm();
    setShowModal(true);
  };

  const getRoleName = (roleValue: string) => {
    const found = roles.find(r => r._id === roleValue || r.name === roleValue);
    return found ? found.name : roleValue;
  };

  if (!token) {
    return <div className="p-8 text-center">Vui lòng đăng nhập để tiếp tục</div>;
  }

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Thêm người dùng
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chức vụ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {accounts.map((acc) => (
              <tr key={acc._id}>
                <td className="px-6 py-4 whitespace-nowrap">{acc.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{acc.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleName(acc.roles?.[0] || '')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${acc.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {acc.isActive ? 'Hoạt động' : 'Khóa'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {isAdmin && (
                    <>
                      <button onClick={() => openEditModal(acc)} className="text-blue-600 hover:text-blue-900 mr-3">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(acc._id)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingAccount ? 'Sửa người dùng' : 'Thêm người dùng'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mật khẩu {!editingAccount && '*'}
                </label>
                <input
                  type="password"
                  required={!editingAccount}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder={editingAccount ? 'Để trống nếu không đổi' : ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Chức vụ *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">-- Chọn chức vụ --</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Hoạt động
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingAccount ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}