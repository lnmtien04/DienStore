// src/app/tin-tuc/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  publishedAt: string;
  tags?: string[];
}

async function getPosts(): Promise<Post[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${API_URL}/api/posts`, {
      next: { revalidate: 3600 }, // cache 1 giờ
      headers: { 'Content-Type': 'application/json' }
      // nếu cần token: Authorization: `Bearer ${token}`
    });

    if (!res.ok) {
      console.error(`Lỗi API: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    console.log('Dữ liệu từ API:', data); // debug

    // Xử lý linh hoạt các định dạng trả về
    if (Array.isArray(data)) {
      return data;
    } else if (data?.data && Array.isArray(data.data)) {
      return data.data;
    } else if (data?.posts && Array.isArray(data.posts)) {
      return data.posts;
    } else {
      console.error('Định dạng API không đúng:', data);
      return [];
    }
  } catch (error) {
    console.error('Lỗi fetch posts:', error);
    return [];
  }
}

export default async function TinTucPage() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Tin tức & Khuyến mãi</h1>
          <p className="text-gray-500">Hiện chưa có bài viết nào.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white text-center mb-4">
          TIN TỨC & KHUYẾN MÃI
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Cập nhật những thông tin mới nhất về sản phẩm và chương trình ưu đãi
        </p>

        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/tin-tuc/${post.slug}`}
              className="group block bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col md:flex-row items-stretch">
                {/* Hình ảnh bên trái */}
                <div className="md:w-1/3 w-full relative">
                  <div className="relative h-56 md:h-full min-h-50 bg-gray-200 dark:bg-gray-700">
                    {post.featuredImage ? (
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                </div>

                {/* Nội dung bên phải */}
                <div className="md:w-2/3 w-full p-6 flex flex-col justify-center">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 transition">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
                      Đọc tiếp →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}