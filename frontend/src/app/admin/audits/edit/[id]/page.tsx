'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface Product {
  _id: string;
  name: string;
  sku: string;
  stock: number;
}

interface AuditItem {
  productId: string;
  productName: string;
  sku: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  note: string;
}

interface Audit {
  _id: string;
  code: string;
  warehouse: string;
  status: string;
  items: Array<{
    product: Product;
    systemStock: number;
    actualStock: number;
    difference: number;
    note?: string;
  }>;
  note: string;
}

export default function EditAuditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [warehouse, setWarehouse] = useState('main');
  const [note, setNote] = useState('');
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Lấy danh sách sản phẩm (cho dropdown thêm)
  useEffect(() => {
    fetchProducts();
  }, []);

  // Lấy thông tin phiếu kiểm kê
  useEffect(() => {
    if (id && token && !initialFetchDone) {
      fetchAudit();
    }
  }, [id, token, initialFetchDone]);

  const fetchProducts = async () => {
  // Không gọi nếu chưa có token
  if (!token) return;

  try {
    const res = await axios.get(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Kiểm tra dữ liệu trả về có phải mảng không
    setProducts(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error('Lỗi tải sản phẩm:', error);
    setProducts([]);
    toast.error('Không thể tải sản phẩm');
  }
};
  const fetchAudit = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/audits/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const audit: Audit = res.data;
      if (audit.status !== 'draft') {
        toast.error('Không thể sửa phiếu đã hoàn thành hoặc hủy');
        router.push(`/admin/audits/${id}`);
        return;
      }
      setWarehouse(audit.warehouse);
      setNote(audit.note || '');
      // Chuyển đổi items từ dạng có product object sang dạng item flat
      const mappedItems: AuditItem[] = audit.items.map((item) => ({
        productId: item.product._id,
        productName: item.product.name,
        sku: item.product.sku,
        systemStock: item.systemStock,
        actualStock: item.actualStock,
        difference: item.difference,
        note: item.note || '',
      }));
      setItems(mappedItems);
      setInitialFetchDone(true);
    } catch (error) {
      toast.error('Không thể tải phiếu kiểm kê');
      router.push('/admin/audits');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (productId: string) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    if (items.some(i => i.productId === productId)) {
      toast.error('Sản phẩm đã có trong danh sách');
      return;
    }
    const newItem: AuditItem = {
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      systemStock: product.stock,
      actualStock: product.stock,
      difference: 0,
      note: '',
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateActualStock = (index: number, value: number) => {
    const newItems = [...items];
    newItems[index].actualStock = value;
    newItems[index].difference = value - newItems[index].systemStock;
    setItems(newItems);
  };

  const updateNote = (index: number, note: string) => {
    const newItems = [...items];
    newItems[index].note = note;
    setItems(newItems);
  };

  const totalDifference = items.reduce((sum, item) => sum + item.difference, 0);
  const hasDifference = items.some(item => item.difference !== 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }
    setSubmitting(true);
    try {
      await axios.put(
        `${API_URL}/api/audits/${id}`,
        {
          warehouse,
          note,
          items: items.map(i => ({
            productId: i.productId,
            actualStock: i.actualStock,
            note: i.note,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cập nhật phiếu kiểm kê thành công');
      router.push(`/admin/audits/${id}`);
    } catch (error) {
      toast.error('Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-lg">
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Sửa phiếu kiểm kê</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái (70%) – Danh sách sản phẩm */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <h2 className="font-semibold mb-3">Danh sách sản phẩm kiểm kê</h2>

              <div className="mb-4 flex gap-2">
                <select
                  onChange={(e) => e.target.value && addProduct(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg"
                  defaultValue=""
                >
                  <option value="" disabled>-- Chọn sản phẩm để thêm --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Tồn: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Sản phẩm</th>
                      <th className="px-3 py-2 text-right">Tồn hệ thống</th>
                      <th className="px-3 py-2 text-right">Tồn thực tế</th>
                      <th className="px-3 py-2 text-right">Chênh lệch</th>
                      <th className="px-3 py-2">Ghi chú</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const diffColor =
                        item.difference > 0
                          ? 'text-green-600'
                          : item.difference < 0
                          ? 'text-red-600'
                          : 'text-slate-500';
                      return (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-xs text-slate-400">{item.sku}</div>
                          </td>
                          <td className="px-3 py-2 text-right">{item.systemStock}</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.actualStock}
                              onChange={(e) =>
                                updateActualStock(idx, parseInt(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 border border-slate-200 rounded text-right"
                            />
                          </td>
                          <td className={`px-3 py-2 text-right font-medium ${diffColor}`}>
                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.note}
                              onChange={(e) => updateNote(idx, e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded"
                              placeholder="Ghi chú"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Cột phải (30%) – Thông tin chung và tổng hợp */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <h2 className="font-semibold mb-3">Thông tin chung</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Kho</label>
                  <select
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="main">Kho chính</option>
                    <option value="hanoi">Kho Hà Nội</option>
                    <option value="hcm">Kho Hồ Chí Minh</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Nhập ghi chú..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <h2 className="font-semibold mb-3">Tổng hợp chênh lệch</h2>
              <div className="text-center">
                <span
                  className={`text-3xl font-bold ${
                    totalDifference > 0
                      ? 'text-green-600'
                      : totalDifference < 0
                      ? 'text-red-600'
                      : 'text-slate-600'
                  }`}
                >
                  {totalDifference > 0 ? `+${totalDifference}` : totalDifference}
                </span>
                <p className="text-sm text-slate-500 mt-1">Tổng số lượng lệch</p>
              </div>
              {hasDifference && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Có sản phẩm chênh lệch. Sau khi hoàn thành, tồn kho sẽ được điều chỉnh.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : ' Cập nhật phiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}