'use client';

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    type: 'support',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts`, form);
      toast.success('Yêu cầu của bạn đã được gửi. Chúng tôi sẽ phản hồi sớm!');
      setForm({ name: '', email: '', phone: '', subject: '', message: '', type: 'support' });
    } catch (error) {
      toast.error('Gửi thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Liên hệ hỗ trợ</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Họ tên *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border p-2 rounded" />
        <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full border p-2 rounded" />
        <input type="tel" placeholder="Số điện thoại" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border p-2 rounded" />
        <input type="text" placeholder="Tiêu đề *" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required className="w-full border p-2 rounded" />
        <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border p-2 rounded">
          <option value="support">Hỗ trợ</option>
          <option value="complaint">Khiếu nại</option>
          <option value="warranty">Bảo hành</option>
          <option value="other">Khác</option>
        </select>
        <textarea placeholder="Nội dung *" value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={5} required className="w-full border p-2 rounded" />
        <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300">Gửi yêu cầu</button>
      </form>
    </div>
  );
}