'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchBackups();
  }, [token]);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/backup`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBackups(res.data);
    } catch (error) {
      toast.error('Không thể tải danh sách backup');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await axios.post(`${API_URL}/api/backup`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Tạo backup thành công');
      fetchBackups(); // tải lại danh sách
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi tạo backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename: string) => {
  try {
    const res = await axios.get(`${API_URL}/api/backup/${filename}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });
    // Tạo link tải
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    toast.error('Tải file thất bại');
  }
};

  const handleDelete = async (filename: string) => {
    if (!confirm(`Bạn có chắc muốn xóa file ${filename}?`)) return;
    try {
      await axios.delete(`${API_URL}/api/backup/${filename}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Xóa backup thành công');
      fetchBackups(); // tải lại danh sách
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi xóa backup');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Sao lưu dữ liệu</h1>

      <div className="mb-6">
        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {creating ? 'Đang tạo...' : 'Tạo bản sao lưu mới'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tên file</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Kích thước</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ngày tạo</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {backups.map((backup) => (
              <tr key={backup.name}>
                <td className="px-6 py-4 whitespace-nowrap">{backup.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatSize(backup.size)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(backup.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleDownload(backup.name)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="Tải về"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(backup.name)}
                    className="text-red-600 hover:text-red-900"
                    title="Xóa"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {backups.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  Chưa có bản sao lưu nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}