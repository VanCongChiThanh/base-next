import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-blue-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-md shadow-blue-200">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                GigWork
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              Nền tảng kết nối việc làm thời vụ hàng đầu Việt Nam.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Cho người tìm việc
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/jobs"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Tìm việc
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Lịch sử công việc
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Cho nhà tuyển dụng
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/jobs/post"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Đăng việc
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Quản lý công việc
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Hỗ trợ</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/profile"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Tài khoản
                </Link>
              </li>
              <li>
                <Link
                  href="/notifications"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Thông báo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-blue-50">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} GigWork. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
