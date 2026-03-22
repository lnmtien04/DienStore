'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Component con chứa logic sử dụng useSearchParams
function PaymentSuccessContent() {
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

// Trang chính bọc trong Suspense
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang xử lý...</p>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}