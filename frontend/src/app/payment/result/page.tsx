'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Component con chứa logic sử dụng useSearchParams
function PaymentResultContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        {success ? (
          <>
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-600 mb-2">Thanh toán thành công!</h1>
            <p className="text-gray-600 mb-4">Cảm ơn bạn đã mua hàng.</p>
          </>
        ) : (
          <>
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-2">Thanh toán thất bại!</h1>
            <p className="text-gray-600 mb-4">Có lỗi xảy ra, vui lòng thử lại.</p>
          </>
        )}
        <Link href={`/admin/orders/${orderId}`}>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Xem chi tiết đơn hàng
          </button>
        </Link>
      </div>
    </div>
  );
}

// Trang chính bọc trong Suspense
export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}