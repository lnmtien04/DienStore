'use client';

import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface AddToCartButtonProps {
  productId: string;
  stock: number;
  className?: string;
}

export default function AddToCartButton({ productId, stock, className = '' }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    await addToCart(productId, 1);
    setLoading(false);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={loading || stock === 0}
      className={`flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition ${className}`}
    >
      <ShoppingCartIcon className="h-5 w-5" />
      <span>{loading ? 'Đang thêm...' : 'Thêm vào giỏ'}</span>
    </button>
  );
}