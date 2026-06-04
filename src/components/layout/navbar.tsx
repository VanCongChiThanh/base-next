"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts";
import { cn } from "@/lib/utils";
import { Role } from "@/types";
import { jobService } from "@/services";
import { toast } from "react-hot-toast";

const MESSAGE_READ_KEY = "message_last_read_at_map_v1";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const messageLinkHref = useMemo(() => "/messages", []);

  useEffect(() => {
    if (!isAuthenticated) {
      setHasUnreadMessages(false);
      return;
    }

    let cancelled = false;
    let lastSeenLatestMessageAt = "";

    // Poll conversation list to detect unread/new messages globally.
    const checkUnreadConversations = async () => {
      try {
        const conversations = await jobService.getMyConversations();
        if (cancelled) return;

        const raw = localStorage.getItem(MESSAGE_READ_KEY);
        const readMap = raw ? (JSON.parse(raw) as Record<string, string>) : {};

        let unreadFound = false;
        let latestUnreadAt = "";

        for (const conversation of conversations) {
          const lastMessageAt = conversation.lastMessage?.createdAt;
          if (!lastMessageAt) continue;

          const readAt = readMap[conversation.applicationId];
          const isUnread = !readAt || new Date(lastMessageAt).getTime() > new Date(readAt).getTime();
          if (isUnread) {
            unreadFound = true;
            if (!latestUnreadAt || new Date(lastMessageAt).getTime() > new Date(latestUnreadAt).getTime()) {
              latestUnreadAt = lastMessageAt;
            }
          }
        }

        if (latestUnreadAt && latestUnreadAt !== lastSeenLatestMessageAt && pathname !== messageLinkHref) {
          toast.success("Bạn có tin nhắn mới từ việc làm");
        }

        lastSeenLatestMessageAt = latestUnreadAt;
        setHasUnreadMessages(unreadFound);
      } catch {
        // Ignore transient polling errors.
      }
    };

    void checkUnreadConversations();
    const intervalId = window.setInterval(checkUnreadConversations, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, pathname, messageLinkHref]);

  const navLinks = [
    {
      href: "/jobs",
      label: "Tìm việc",
      icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    },
    { href: "/jobs/post", label: "Đăng việc", icon: "M12 4v16m8-8H4" },
    {
      href: "/services",
      label: "Thuê ngay",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      href: "/messages",
      label: "Tin nhắn ",
      icon: "M8 10h8m-8 4h5m-7 7 4.684-4.684A2 2 0 0111.1 15.9H17a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v13z",
    },
  ];

  const userLinks = isAuthenticated
    ? [
        { href: "/dashboard", label: "Quản lý việc làm" },
        { href: "/saved-jobs", label: "Việc đã lưu" },
        { href: "/profile", label: "Hồ sơ" },
      ]
    : [];

  const workerLinks = isAuthenticated
    ? [{ href: "/services/new", label: "Đăng Thuê Tôi" }]
    : [];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-blue-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-md shadow-blue-200 group-hover:shadow-lg group-hover:shadow-blue-300 transition-all">
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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-blue-50/50 hover:text-blue-600",
                )}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={link.icon}
                  />
                </svg>
                <span className="relative inline-flex items-center">
                  {link.label}
                  {link.href === messageLinkHref && hasUnreadMessages && (
                    <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />
                  )}
                </span>
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {user?.role === Role.ADMIN && (
                  <Link
                    href="/admin"
                    className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    Admin
                  </Link>
                )}

                {/* Upgrade Button */}
                <Link
                  href="/pricing"
                  className="relative flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 text-white shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 hover:-translate-y-0.5 transition-all overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  Nâng cấp
                </Link>

                <Link
                  href="/notifications"
                  className="relative p-2 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-blue-50 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-sky-300 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                      {user?.firstName?.charAt(0) || "U"}
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user?.firstName}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg shadow-blue-100/50 border border-blue-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {userLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <hr className="my-1 border-blue-50" />
                    {workerLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 transition-colors font-medium border-l-2 border-indigo-500"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <hr className="my-1 border-blue-50" />
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/pricing"
                  className="relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 text-white shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 hover:-translate-y-0.5 transition-all overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  Nâng cấp Pro
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-sky-400 rounded-xl hover:shadow-md hover:shadow-blue-200 transition-all"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Dong menu" : "Mo menu"}
            title={mobileOpen ? "Dong menu" : "Mo menu"}
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-blue-50 transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-blue-50 bg-white/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  pathname === link.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-blue-50/50",
                )}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={link.icon}
                  />
                </svg>
                <span className="relative inline-flex items-center">
                  {link.label}
                  {link.href === messageLinkHref && hasUnreadMessages && (
                    <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />
                  )}
                </span>
              </Link>
            ))}
            {/* Mobile Upgrade */}
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 to-orange-400 text-white"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              Nâng cấp Pro
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/notifications"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50/50 transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  Thông báo
                </Link>
                {user?.role === Role.ADMIN && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50/50 transition-all"
                  >
                    Admin
                  </Link>
                )}
                {userLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-blue-50/50 transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
                {workerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm font-medium text-indigo-700 hover:bg-indigo-50 border-l-2 border-indigo-500 transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-sky-400 rounded-xl"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
