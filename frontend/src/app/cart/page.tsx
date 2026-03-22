'use client';

import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function CartPage() {
  const { cart, loading, itemCount, updateQuantity, removeFromCart } = useCart();
  const { user } = useUser();
  const { t } = useLanguage();
  const router = useRouter();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (cart?.items.length) {
      setSelectAll(selectedItems.size === cart.items.length);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, cart?.items.length]);

  const selectedTotal = cart?.items.reduce((sum, item) => {
    if (selectedItems.has(item.product._id)) {
      return sum + item.product.price * item.quantity;
    }
    return sum;
  }, 0) || 0;

  const selectedCount = selectedItems.size;

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
    } else {
      const allIds = new Set(cart?.items.map(item => item.product._id));
      setSelectedItems(allIds);
    }
  };

  const handleSelectItem = (productId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-500 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Giỏ hàng</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Vui lòng đăng nhập để xem giỏ hàng</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Giỏ hàng trống</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Hãy thêm sản phẩm vào giỏ để tiếp tục</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Mua sắm ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="mr-4 text-gray-600 dark:text-gray-300 hover:text-blue-600">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Giỏ hàng ({itemCount} sản phẩm)</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Danh sách sản phẩm */}
          <div className="lg:col-span-2 space-y-4">
            {/* Checkbox chọn tất cả */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700 dark:text-gray-300">
                Chọn tất cả ({selectedCount}/{cart.items.length})
              </span>
            </div>

            {cart.items.map((item) => (
              <div
                key={item.product._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex flex-col sm:flex-row items-center gap-4"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.product._id)}
                  onChange={() => handleSelectItem(item.product._id)}
                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 self-center"
                />

                {/* Ảnh sản phẩm */}
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                  {item.product.images?.[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {t('product.no_image')}
                    </div>
                  )}
                </div>

                {/* Thông tin sản phẩm */}
                <div className="flex-1 w-full sm:w-auto">
                  <Link href={`/products/${item.product._id}`}>
                    <h3 className="font-semibold text-gray-800 dark:text-white hover:text-blue-600 line-clamp-2">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('common.price')}: {item.product.price.toLocaleString('vi-VN')}đ
                  </p>

                  {/* Điều khiển số lượng và nút xóa */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded">
                      <button
                        onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-gray-800 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.product._id)}
                      className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Thành tiền */}
                <div className="font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap self-center">
                  {(item.product.price * item.quantity).toLocaleString('vi-VN')}đ
                </div>
              </div>
            ))}
          </div>

          {/* Tổng thanh toán */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Tổng thanh toán
              </h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Tạm tính ({selectedCount} sản phẩm):</span>
                  <span className="font-medium">{selectedTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span className="text-green-600 dark:text-green-400">Miễn phí</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Tổng cộng:</span>
                    <span className="text-blue-600 dark:text-blue-400">{selectedTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (selectedCount === 0) {
                    alert('Vui lòng chọn ít nhất một sản phẩm');
                    return;
                  }
                  const selectedIds = Array.from(selectedItems).join(',');
                  router.push(`/checkout?selected=${encodeURIComponent(selectedIds)}`);
                }}
                disabled={selectedCount === 0}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition"
              >
                Tiến hành đặt hàng ({selectedCount})
              </button>

              <Link
                href="/products"
                className="block text-center mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}