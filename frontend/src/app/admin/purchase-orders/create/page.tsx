'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Product {
  _id: string;
  name: string;
  sku: string;
  stock: number;
}

interface Supplier {
  _id: string;
  name: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}

export default function CreatePurchaseOrderPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const [productList, setProductList] = useState<Product[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);

  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data);
    } catch (error) {
      toast.error('Lỗi tải nhà cung cấp');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
      setProductList(res.data);
    } catch (error) {
      toast.error('Lỗi tải sản phẩm');
    }
  };

  const addItem = (product: Product) => {
    // Kiểm tra xem sản phẩm đã có trong danh sách chưa
    if (items.some(item => item.productId === product._id)) {
      toast.error('Sản phẩm đã có trong phiếu');
      return;
    }
    setItems([
      ...items,
      {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        purchasePrice: 0,
        total: 0,
      },
    ]);
    setShowProductSearch(false);
    setSearchProduct('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: 'quantity' | 'purchasePrice', value: number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index].total = newItems[index].quantity * newItems[index].purchasePrice;
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async (e: React.FormEvent, action: 'draft' | 'approve') => {
    e.preventDefault();
    if (!selectedSupplier) {
      toast.error('Chọn nhà cung cấp');
      return;
    }
    if (items.length === 0) {
      toast.error('Thêm ít nhất một sản phẩm');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        supplier: selectedSupplier,
        orderDate,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
        })),
        notes,
      };
      const res = await axios.post(`${API_URL}/api/purchase-orders`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const orderId = res.data._id;
      if (action === 'approve') {
        await axios.post(`${API_URL}/api/purchase-orders/${orderId}/approve`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Phiếu nhập đã được tạo và duyệt');
      } else {
        toast.success('Đã lưu phiếu nháp');
      }
      router.push('/admin/purchase-orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi tạo phiếu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tạo phiếu nhập mới</h1>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Thông tin chung */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Thông tin chung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp *</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              >
                <option value="">Chọn nhà cung cấp</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nhập</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Danh sách sản phẩm</h2>
            <button
              type="button"
              onClick={() => setShowProductSearch(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              <PlusIcon className="w-5 h-5" />
              Thêm sản phẩm
            </button>
          </div>

          {showProductSearch && (
            <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchProduct}
                onChange={(e) => {
                  setSearchProduct(e.target.value);
                  const filtered = products.filter(p =>
                    p.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                    p.sku?.toLowerCase().includes(e.target.value.toLowerCase())
                  );
                  setProductList(filtered);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg mb-2"
                autoFocus
              />
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y">
                {productList.map(p => (
                  <div
                    key={p._id}
                    onClick={() => addItem(p)}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-slate-400 text-sm">Tồn: {p.stock}</span>
                  </div>
                ))}
                {productList.length === 0 && (
                  <p className="px-3 py-2 text-slate-500">Không tìm thấy sản phẩm</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowProductSearch(false)}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Đóng
              </button>
            </div>
          )}

          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Sản phẩm</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Tồn</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Số lượng</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Giá nhập</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Thành tiền</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => {
                    const product = products.find(p => p._id === item.productId);
                    return (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm">{item.productName}</td>
                        <td className="px-3 py-2 text-sm text-slate-500">{item.sku}</td>
                        <td className="px-3 py-2 text-sm text-slate-500">{product?.stock || 0}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-slate-200 rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={item.purchasePrice}
                            onChange={(e) => updateItem(index, 'purchasePrice', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-slate-200 rounded"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm font-medium">
                          {item.total.toLocaleString()}đ
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-4 text-slate-500">Chưa thêm sản phẩm</p>
          )}

          <div className="mt-4 text-right text-lg font-semibold">
            Tổng tiền: <span className="text-blue-600">{totalAmount.toLocaleString()}đ</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Lưu nháp
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'approve')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Duyệt & nhập kho
          </button>
        </div>
      </form>
    </div>
  );
}