'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import 'quill/dist/quill.snow.css';
import { useQuill } from 'react-quilljs';

export default function EditPostPage() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

  // Fetch bài viết
  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    const fetchPost = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts/admin/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const post = res.data;
        setTitle(post.title);
        setExcerpt(post.excerpt || '');
        setTags(post.tags ? post.tags.join(', ') : '');
        setStatus(post.status);
        setCurrentImage(post.featuredImage || '');
        setPreview(post.featuredImage || '');
        // Khi quill sẵn sàng, paste nội dung
      } catch (error) {
        toast.error('Không thể tải bài viết');
        router.push('/admin/posts');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, token, router, API_URL]);

  // Set nội dung ban đầu cho quill
  useEffect(() => {
    if (quill && !loading) {
      // Giả sử bạn đã lưu content từ API vào một state riêng
      // Ở đây cần fetch cả content nữa! Bổ sung:
      const fetchContent = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/posts/admin/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const post = res.data;
          if (post.content) {
            quill.clipboard.dangerouslyPasteHTML(post.content);
          }
        } catch (error) {
          console.error('Lỗi load content:', error);
        }
      };
      fetchContent();
    }
  }, [quill, loading, id, token, API_URL]);

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
    if (!quill) {
      toast.error('Editor chưa sẵn sàng');
      return;
    }
    const content = quill.root.innerHTML;
    if (!content || content === '<p><br></p>') {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('excerpt', excerpt);
    formData.append('tags', tags);
    formData.append('status', status);
    if (featuredImage) formData.append('featuredImage', featuredImage);

    try {
      await axios.put(`${API_URL}/api/posts/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Cập nhật bài viết thành công');
      router.push('/admin/posts');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Chỉnh sửa bài viết</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... các trường giống trang new ... */}
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
          <label className="block text-sm font-medium mb-1">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh đại diện</label>
          {currentImage && !featuredImage && (
            <div className="mb-2">
              <p className="text-sm text-gray-500">Ảnh hiện tại:</p>
              <img src={currentImage} alt="Current" className="w-40 h-40 object-cover rounded" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {featuredImage && preview && (
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
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {submitting ? 'Đang xử lý...' : 'Cập nhật'}
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