'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="text-center py-20">
      <div className="text-green-600 text-6xl mb-4">✔</div>
      <h1 className="text-3xl font-bold mb-2">Thanh toán thành công!</h1>
      <p className="text-gray-600 mb-6">Cảm ơn bạn đã mua hàng.</p>
      <Link href={`/orders/${orderId}`} className="bg-blue-600 text-white px-6 py-2 rounded">
        Xem đơn hàng
      </Link>
    </div>
  );
}