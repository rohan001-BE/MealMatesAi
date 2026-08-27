"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore from "../store/authStore";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/meal-planner",
  "/setup-account",
  "/your-diet",
  "/calories-application",
  "/calories-result",
  "/dietary-type",
  "/meal-type",
  "/number-of-days",
  "/meal-plan-result",
  "/custom-category",
  "/ingredients",
  "/about",
  "/contact",
  "/how-it-works",
  "/reviews",
  "/help",
  "/privacy",
  "/terms",
  "/faq",
  "/features",
  "/pricing",
];

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!mounted || isLoading) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/onboarding"));
    if (!isAuthenticated && !isPublic) {
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, isLoading, mounted, router]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf5ef]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/onboarding"));

  if (isLoading && !isPublic) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf5ef]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const isHomePage = pathname === "/";
  const isAuthPage = ["/login", "/signup"].includes(pathname);
  const isChatbotPage = pathname.startsWith("/chatbot");

  return (
    <div className={`flex flex-col ${isChatbotPage ? "h-screen overflow-hidden" : "min-h-screen"} bg-[#faf5ef] text-gray-800 antialiased font-sans`}>
      {/* Top Navbar on all non-auth, non-home pages */}
      {!isAuthPage && !isHomePage && <Navbar />}

      {/* Main Page Area */}
      <main className={`flex-1 ${!isHomePage && !isAuthPage ? "pt-[68px]" : ""} ${isChatbotPage ? "h-[calc(100vh-68px)] overflow-hidden flex flex-col" : ""}`}>
        {children}
      </main>

      {/* Footer on all non-auth, non-home, non-chatbot pages */}
      {!isAuthPage && !isHomePage && !isChatbotPage && <Footer />}

      <ToastContainer position="top-center" autoClose={3000} theme="colored" />
    </div>
  );
}
