'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

interface Post {
  _id: string;
  title: string;
  slug: string;
  featuredImage?: string;
  status: 'draft' | 'published';
  views: number;
  createdAt: string;
  author?: { fullName: string };
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchPosts();
  }, [token]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(res.data.posts || res.data);
    } catch (error) {
      console.error('Lỗi tải bài viết:', error);
      toast.error('Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await axios.delete(`${API_URL}/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Xóa bài viết thành công');
      fetchPosts();
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý bài viết</h1>
        <Link
          href="/admin/posts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Thêm bài viết
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ảnh</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tiêu đề</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Lượt xem</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ngày tạo</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
  {posts.map((post) => (
    <tr key={post._id}>
      {/* 1. Ảnh */}
      <td className="px-6 py-4 whitespace-nowrap">
        {post.featuredImage ? (
          <div className="relative w-16 h-12">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover rounded"
              unoptimized
            />
          </div>
        ) : (
          <span className="text-gray-400">No image</span>
        )}
      </td>

      {/* 2. Tiêu đề */}
      <td className="px-6 py-4 whitespace-nowrap font-medium">
        {post.title}
      </td>

      {/* 3. Trạng thái */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            post.status === 'published'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {post.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
        </span>
      </td>

      {/* 4. Lượt xem */}
      <td className="px-6 py-4 whitespace-nowrap text-sm">{post.views}</td>

      {/* 5. Ngày tạo */}
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {new Date(post.createdAt).toLocaleDateString('vi-VN')}
      </td>

      {/* 6. Thao tác */}
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <Link
          href={`/admin/posts/${post._id}/edit`}
          className="text-blue-600 hover:text-blue-900 mr-3"
        >
          <PencilIcon className="w-5 h-5 inline" />
        </Link>
        <button
          onClick={() => handleDelete(post._id)}
          className="text-red-600 hover:text-red-900"
        >
          <TrashIcon className="w-5 h-5 inline" />
        </button>
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    </div>
  );
}