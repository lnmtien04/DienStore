import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { CalendarIcon, UserIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/outline';
interface Author {
  _id: string;
  fullName: string;
  name?: string;
}

interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  publishedAt: string;
  tags?: string[];
  author?: string | Author;
  views?: number;
  readingTime?: number;
}

async function getPost(slug: string): Promise<Post | null> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
  try {
    const url = API_URL ? `${API_URL}/api/posts/${slug}` : `/api/posts/${slug}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') return data as Post;
    }
    // Mock data fallback
    const mockPosts: Post[] = [
      {
        _id: '1',
        title: 'Cách chọn tủ lạnh phù hợp với nhu cầu gia đình',
        slug: 'cach-chon-tu-lanh-phu-hop',
        content: '<p>Nội dung chi tiết bài viết...</p>',
        excerpt: 'Bí quyết chọn tủ lạnh theo dung tích, công nghệ Inverter và thương hiệu uy tín',
        featuredImage: '/image/23.jpg',
        publishedAt: '2026-03-06T07:00:00.000Z',
        tags: ['tủ lạnh', 'tư vấn'],
        author: 'Admin',
        views: 1234,
        readingTime: 5
      },
      {
        _id: '2',
        title: 'FLASH SALE CUỐI TUẦN – GIẢM SỐC TỦ LẠNH',
        slug: 'flash-sale-tu-lanh',
        content: '<p>Nội dung khuyến mãi...</p>',
        excerpt: 'Ưu đãi lớn nhất năm cho các dòng tủ lạnh Panasonic, LG, Samsung',
        featuredImage: '/image/31.jpg',
        publishedAt: '2026-03-05T10:00:00.000Z',
        tags: ['sale', 'tủ lạnh'],
        author: 'Marketing',
        views: 2345,
        readingTime: 3
      },
      {
        _id: '3',
        title: 'Xu hướng thiết bị nhà bếp thông minh 2026',
        slug: 'xu-huong-thiet-bi-nha-bep-thong-minh-2026-nang-tam-khong-gian-am-thuc-gia-djinh',
        content: '<p>Nội dung về thiết bị nhà bếp...</p>',
        excerpt: 'Khám phá những công nghệ mới nhất trên bếp từ, lò vi sóng, máy rửa bát',
        featuredImage: '/image/bep.jpg',
        publishedAt: '2026-03-04T00:00:00.000Z',
        tags: ['nhà bếp', 'xu hướng'],
        author: 'Content',
        views: 567,
        readingTime: 4
      }
    ];
    return mockPosts.find(p => p.slug === slug) || null;
  } catch (error) {
    console.error('Lỗi fetch post:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return {
      title: 'Bài viết không tồn tại',
      description: 'Không tìm thấy bài viết yêu cầu.'
    };
  }
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [{ url: post.featuredImage }] : [],
      type: 'article',
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function ChiTietTinTucPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const readingTime = post.readingTime || Math.ceil(post.content.split(' ').length / 200);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm flex flex-wrap items-center text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link href="/tin-tuc" className="hover:text-blue-600">Tin tức</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-300 truncate max-w-50 md:max-w-sm" title={post.title}>
            {post.title.length > 40 ? post.title.substring(0, 40) + '…' : post.title}
          </span>
        </div>

        <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Ảnh bên trái */}
            {post.featuredImage && (
              <div className="lg:w-2/5 w-full">
                <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />
                </div>
              </div>
            )}

            {/* Nội dung bên phải */}
            <div className="lg:w-3/5 w-full">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                {post.title}
              </h1>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
  <span className="flex items-center gap-1">
    <CalendarIcon className="w-4 h-4" />
    {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
  </span>
  {(() => {
    if (!post.author) return null;
    const authorName = typeof post.author === 'string' 
      ? post.author 
      : post.author?.fullName || post.author?.name || 'Unknown';
    return (
      <span className="flex items-center gap-1">
        <UserIcon className="w-4 h-4" />
        {authorName}
      </span>
    );
  })()}
  {post.views !== undefined && (
    <span className="flex items-center gap-1">
      <EyeIcon className="w-4 h-4" />
      {post.views.toLocaleString()} lượt xem
    </span>
  )}
  <span className="flex items-center gap-1">
    <ClockIcon className="w-4 h-4" />
    {readingTime} phút đọc
  </span>
</div>

             {/* Tags */}
{post.tags && post.tags.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-6">
    {post.tags.map(tag => (
      <Link
        key={tag}
        href={`/tin-tuc?tag=${encodeURIComponent(tag)}`}
        className="px-3 py-1 bg-linear-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full hover:scale-105 transition-transform shadow-sm"
      >
        #{tag}
      </Link>
    ))}
  </div>
)}

              {/* Excerpt */}
              {post.excerpt && (
                <div className="text-lg text-gray-600 dark:text-gray-300 italic border-l-4 border-blue-500 pl-4 mb-6">
                  {post.excerpt}
                </div>
              )}

              {/* Nội dung */}
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </div>

          {/* Chia sẻ */}
          <hr className="my-8 border-gray-200 dark:border-gray-700" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chia sẻ:</span>
            <div className="flex gap-3">
              <a href="#" className="text-gray-500 hover:text-blue-600 transition">Facebook</a>
              <a href="#" className="text-gray-500 hover:text-blue-400 transition">Twitter</a>
              <a href="#" className="text-gray-500 hover:text-pink-500 transition">Pinterest</a>
            </div>
          </div>
        </article>

        {/* Bài viết liên quan */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Bài viết liên quan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl shadow-sm">
              <p className="text-gray-500 italic">Đang cập nhật...</p>
            </div>
          </div>
        </div>

        {/* Nút quay lại */}
        <div className="mt-12 text-center">
          <Link
  href="/tin-tuc"
  className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-lg"
>
  <span>← Xem tất cả bài viết</span>
</Link>
        </div>
      </div>
    </div>
  );
}