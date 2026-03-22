'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import 'quill/dist/quill.snow.css';
import { useQuill } from 'react-quilljs';

export default function NewPostPage() {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Khởi tạo Quill
  const { quill, quillRef } = useQuill({
    theme: 'snow',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
    },
    placeholder: 'Viết nội dung bài viết...',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Lấy nội dung trực tiếp từ quill
    if (!quill) {
      toast.error('Editor chưa sẵn sàng, vui lòng thử lại');
      return;
    }
    const content = quill.root.innerHTML;
    if (!content || content === '<p><br></p>') {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content); // gửi content lấy từ quill
    formData.append('excerpt', excerpt);
    formData.append('tags', tags);
    formData.append('status', status);
    if (featuredImage) formData.append('featuredImage', featuredImage);

    try {
      await axios.post(`${API_URL}/api/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Thêm bài viết thành công');
      router.push('/admin/posts');
    } catch (error: any) {
      console.error('Submit error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Thêm bài viết mới</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... các trường title, excerpt, tags, ảnh, status giữ nguyên ... */}
        <div>
          <label className="block text-sm font-medium mb-1">Tiêu đề</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nội dung</label>
          <div ref={quillRef} className="h-64 mb-10" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tags (cách nhau bằng dấu phẩy)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="sale, điện máy, tủ lạnh"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh đại diện</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {preview && (
            <div className="mt-2 relative w-40 h-40">
              <img src={preview} alt="Preview" className="object-cover w-full h-full rounded" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="draft">Bản nháp</option>
            <option value="published">Xuất bản</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Đang xử lý...' : 'Lưu bài viết'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}