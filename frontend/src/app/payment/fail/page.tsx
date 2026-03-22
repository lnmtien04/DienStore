'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentFail() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Thanh toán thất bại';

  return (
    <div className="text-center py-20">
      <div className="text-red-600 text-6xl mb-4">✘</div>
      <h1 className="text-3xl font-bold mb-2">Thanh toán thất bại</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      <Link href="/cart" className="bg-blue-600 text-white px-6 py-2 rounded">
        Quay lại giỏ hàng
      </Link>
    </div>
  );
}