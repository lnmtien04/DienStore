'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import {
  StarIcon,
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    images: string[];
  };
  quantity: number;
  price: number;
  variant?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
}

interface ReviewState {
  [productId: string]: {
    rating: number;
    comment: string;
    images: File[];
    previews: string[];
  };
}

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  console.log('ReviewPage - id from params:', id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<ReviewState>({});
  const [hoverRating, setHoverRating] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchOrder();
  }, [token, id]);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Order data:', res.data);
      setOrder(res.data);
      // Khởi tạo state review cho từng sản phẩm
      const initialReviews: ReviewState = {};
      res.data.items.forEach((item: OrderItem) => {
        initialReviews[item.product._id] = {
          rating: 0,
          comment: '',
          images: [],
          previews: [],
        };
      });
      setReviews(initialReviews);
    } catch (error: any) {
      console.error('Lỗi tải đơn hàng:', error.response?.data || error.message);
      toast.error('Không thể tải thông tin đơn hàng');
      // Không redirect để xem lỗi
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (productId: string, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating },
    }));
  };

  const handleCommentChange = (productId: string, comment: string) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], comment },
    }));
  };

  const handleImageUpload = (productId: string, files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));

    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        images: [...prev[productId].images, ...newFiles],
        previews: [...prev[productId].previews, ...newPreviews],
      },
    }));
  };

  const removeImage = (productId: string, index: number) => {
    setReviews(prev => {
      const updated = { ...prev };
      // Thu hồi URL để tránh memory leak
      URL.revokeObjectURL(updated[productId].previews[index]);
      updated[productId].images = updated[productId].images.filter((_, i) => i !== index);
      updated[productId].previews = updated[productId].previews.filter((_, i) => i !== index);
      return updated;
    });
  };

  const validateReview = (productId: string) => {
    const review = reviews[productId];
    if (review.rating === 0) {
      toast.error('Vui lòng chọn số sao');
      return false;
    }
    return true;
  };

  const submitReview = async (productId: string) => {
    
    if (!validateReview(productId)) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
formData.append('productId', productId);
formData.append('orderId', id as string);  // 👈 THÊM DÒNG NÀY
formData.append('rating', reviews[productId].rating.toString());
formData.append('comment', reviews[productId].comment);
reviews[productId].images.forEach(file => {
  formData.append('images', file);
});
     

      await axios.post(`${API_URL}/api/reviews`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Đánh giá thành công!');
      // Có thể đánh dấu sản phẩm đã review (nếu API trả về)
      // Ở đây ta có thể chuyển hướng hoặc reload
    } catch (error: any) {
  console.error('Lỗi gửi đánh giá:', error);
  if (error.response) {
    console.error('Server response:', error.response.data);
    toast.error(error.response.data?.message || 'Không thể gửi đánh giá');
  } else {
    toast.error('Lỗi kết nối');
  }
}
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[1, 2].map(i => (
          <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500 mb-4">Không tìm thấy đơn hàng</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          Quay lại
        </button>
      </div>
    );
  }

  const allReviewed = Object.values(reviews).every(r => r.rating > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 dark:text-gray-300">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Đánh giá sản phẩm</h1>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Đơn hàng #{order.orderNumber}
      </p>

      <div className="space-y-8">
        {order.items.map((item) => {
          const productId = item.product._id;
          const review = reviews[productId];
          if (!review) return null;

          return (
            <div
              key={productId}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              {/* Thông tin sản phẩm */}
              <div className="flex gap-4 mb-4">
                <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                  {item.product.images?.[0] && (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{item.product.name}</h3>
                  {item.variant && (
                    <p className="text-sm text-gray-500">Phân loại: {item.variant}</p>
                  )}
                  <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                </div>
              </div>

              {/* Chọn sao */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Chất lượng sản phẩm</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(productId, star)}
                      onMouseEnter={() => setHoverRating(prev => ({ ...prev, [productId]: star }))}
                      onMouseLeave={() => setHoverRating(prev => ({ ...prev, [productId]: 0 }))}
                      className="focus:outline-none"
                    >
                      {star <= (hoverRating[productId] || review.rating) ? (
                        <StarIconSolid className="w-8 h-8 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhận xét */}
              <div className="mb-4">
                <label htmlFor={`comment-${productId}`} className="block text-sm font-medium mb-2">
                  Nhận xét (không bắt buộc)
                </label>
                <textarea
                  id={`comment-${productId}`}
                  rows={3}
                  value={review.comment}
                  onChange={(e) => handleCommentChange(productId, e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Upload ảnh */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Hình ảnh thực tế (không bắt buộc)</label>
                <div className="flex flex-wrap gap-3">
                  {review.previews.map((preview, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Image src={preview} alt="preview" fill className="object-cover" unoptimized />
                      <button
                        onClick={() => removeImage(productId, idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition">
                    <PhotoIcon className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400">Tải ảnh</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(productId, e.target.files)}
                    />
                  </label>
                </div>
              </div>

              {/* Nút gửi đánh giá cho sản phẩm này */}
              <div className="flex justify-end">
                <button
                  onClick={() => submitReview(productId)}
                  disabled={submitting || review.rating === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nếu tất cả đã review, hiển thị nút quay lại */}
      {allReviewed && (
        <div className="mt-8 text-center">
          <Link
            href="/profile"
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      )}
    </div>
  );
}