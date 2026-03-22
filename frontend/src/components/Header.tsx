'use client';

import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import Navbar from './Navbar';

export default function Header() {
  const { user, logout } = useUser();

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md">
  <div className="container mx-auto px-2 py-0 flex items-center justify-between">

        <div className="flex items-center space-x-4">
        
        </div>
      </div>

      <Navbar />
    </header>
  );
}