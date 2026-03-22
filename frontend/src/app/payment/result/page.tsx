'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState(false);
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    setSuccess(searchParams.get('success') === 'true');
  }, [searchParams]);

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