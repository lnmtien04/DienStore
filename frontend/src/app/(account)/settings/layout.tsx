export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 pt-6">
      {/* Tiêu đề với thanh dọc gradient và chữ gradient */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-linear-to-b from-blue-500 to-blue-600 rounded-full"></div>
        <h1 className="text-3xl md:text-4xl font-extrabold bg-linear-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
          Thiết Lập Tài Khoản
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        {children}
      </div>
    </div>
  );
}