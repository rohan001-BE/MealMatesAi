"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronRight, Camera } from "lucide-react";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";
import { FiLogOut } from "react-icons/fi";
import {
  FaUtensils,
  FaSave,
  FaAppleAlt,
  FaClock,
  FaChartBar,
  FaUserAlt,
  FaQuestionCircle,
  FaRobot,
  FaTachometerAlt,
  FaStore,
  FaFire,
  FaMagic,
  FaStar,
  FaInfoCircle,
  FaBookOpen,
  FaCalculator,
  FaLeaf,
} from "react-icons/fa";

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarRef = useRef(null);

  const {
    user,
    profileImage,
    uploadProfileImage,
    logout,
  } = useAuthStore();

  const router = useRouter();
  const pathname = usePathname();

  const isHomePage = pathname === "/";
  const isTransparentNavPage = ["/meal-planner", "/custom-category"].includes(pathname);

  // Scroll behavior: hide when scrolling down on home page, show at top
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 10) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    if (isHomePage) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      setIsVisible(true);
    }
  }, [isHomePage]);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isSidebarOpen
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully! See you soon!");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to log out. Please try again.");
    }
  };

  const handleImageUpload = async (event) => {
    if (!user) {
      toast.error("Please log in to update your profile picture");
      router.push("/login");
      return;
    }

    const file = event.target.files[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error("Please upload a valid image file (JPEG/PNG/WEBP) under 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      await uploadProfileImage(file);
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Planner", to: "/meal-planner" },
    { label: "Custom", to: "/custom-category" },
    { label: "Store", to: "/ingredients" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "Chatbot", to: "/chatbot" },
  ];

  const sidebarSections = [
    {
      title: "AI Intelligence & Planning",
      items: [
        { to: "/dashboard", label: "Dashboard Overview", icon: <FaTachometerAlt />, badge: "Live" },
        { to: "/chatbot", label: "AI Nutritionist Pro", icon: <FaRobot />, highlight: true, badge: "Pro" },
        { to: "/meal-planner", label: "AI Meal Planner", icon: <FaUtensils />, badge: "Multi-Day" },
        { to: "/calories-application", label: "Calorie & Macro Calculator", icon: <FaCalculator /> },
        { to: "/custom-category", label: "Custom Diet & Restrictions", icon: <FaMagic /> },
        { to: "/recipes", label: "Explore 650+ Recipes", icon: <FaLeaf /> },
      ],
    },
    {
      title: "Meals & Nutrition Management",
      items: [
        { to: "/my-meal-plans", label: "Saved Meal Plans", icon: <FaSave /> },
        { to: "/custom-recipes", label: "Create Custom Recipe", icon: <FaUtensils /> },
        { to: "/ingredients", label: "Healthy Grocery Store", icon: <FaStore /> },
      ],
    },
    {
      title: "Personal Calibration",
      items: [
        { to: "/diet-nutrition", label: "Dietary Preferences", icon: <FaAppleAlt /> },
        { to: "/meals-schedule", label: "Meal Schedule & Slots", icon: <FaClock /> },
        { to: "/physical-stats", label: "Physical Vitals & BMR", icon: <FaChartBar /> },
        { to: "/update-profile", label: "Account Profile & Avatar", icon: <FaUserAlt /> },
      ],
    },
    {
      title: "Community & Platform",
      items: [
        { to: "/reviews", label: "Community Reviews", icon: <FaStar />, badge: "5.0 ★" },
        { to: "/how-it-works", label: "How It Works", icon: <FaBookOpen /> },
        { to: "/about", label: "About Meal Mate AI", icon: <FaInfoCircle /> },
        { to: "/contact", label: "Contact Support", icon: <FaQuestionCircle /> },
        { to: "/help", label: "Help & FAQ", icon: <FaQuestionCircle /> },
      ],
    },
  ];

  const navBgClass = isHomePage
    ? "bg-transparent"
    : isTransparentNavPage
    ? "bg-transparent backdrop-blur-sm"
    : "bg-white/95 backdrop-blur-md shadow-sm border-b border-orange-100";

  const textColorClass = isHomePage
    ? "text-white hover:text-orange-400 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
    : "text-gray-700 hover:text-orange-500";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${navBgClass} ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
          {/* Logo with Meal Mates^AI text */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/assets/logo.png"
              alt="Meal Mates Logo"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover shadow-sm transition-transform group-hover:scale-105"
              onError={(e) => {
                e.target.src = "/assets/full logo.png";
              }}
            />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-orange-500 font-headline inline-flex items-baseline">
              Meal Mates<sup className="text-[10px] sm:text-xs font-black uppercase text-black ml-0.5">AI</sup>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex space-x-6 lg:space-x-7 items-center">
            {navLinks.map(({ label, to }) => {
              const isActive = pathname === to;
              return (
                <li key={label} className="group relative">
                  <Link
                    href={to}
                    className={`text-sm font-bold transition-colors duration-200 ${
                      isActive ? "text-orange-500 font-black" : textColorClass
                    }`}
                  >
                    {label}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-orange-500 transition-all duration-300 ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right Auth / User controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 rounded-full px-3.5 py-1.5 transition-all shadow-xs"
                >
                  <FaTachometerAlt size={12} />
                  <span>Dashboard</span>
                </Link>
                {/* Single unified button for logged in user (drawer) */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`p-1.5 sm:p-2 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                    isHomePage
                      ? "text-white hover:bg-white/10"
                      : "text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                  }`}
                  aria-label="Open menu drawer"
                >
                  <img
                    src={user?.profileImage || profileImage || "/assets/default-profile.png"}
                    alt={user?.username || "Avatar"}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-orange-400"
                    onError={(e) => {
                      e.target.src = "/assets/default-profile.png";
                    }}
                  />
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2.5">
                  <Link
                    href="/login"
                    className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-full transition-all duration-300 ${
                      isHomePage
                        ? "text-white bg-white/10 hover:bg-orange-500 border border-white/30"
                        : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Sign Up
                  </Link>
                </div>

                {/* Single Mobile Nav Toggle */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className={`md:hidden p-2 rounded-xl transition-all cursor-pointer ${
                    isHomePage ? "text-white bg-white/10" : "text-gray-700 bg-orange-50"
                  }`}
                  aria-label="Toggle navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[190] transition-opacity duration-300"
        />
      )}

      {/* High-End Slide-out Tray Drawer for ALL Users (Desktop & Mobile) */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-[320px] sm:w-[360px] bg-white z-[200] shadow-2xl transform transition-transform duration-300 ease-out border-l border-orange-100 flex flex-col justify-between ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-orange-100">
          {/* Top Bar with Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/assets/logo.png"
                alt="Meal Mate"
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  e.target.src = "/assets/full logo.png";
                }}
              />
              <span className="text-xs font-black uppercase tracking-widest text-orange-500 font-headline">
                Navigation Console
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-orange-50 text-gray-500 hover:text-orange-500 flex items-center justify-center transition cursor-pointer"
              aria-label="Close tray"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Bento Card OR Guest Banner */}
          {user ? (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white p-5 shadow-xl shadow-orange-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

              <div className="flex items-center gap-3.5 relative z-10">
                <label
                  htmlFor="navbarProfileUpload"
                  className="cursor-pointer group relative shrink-0"
                  title="Click to update avatar"
                >
                  <img
                    src={user?.profileImage || profileImage || "/assets/default-profile.png"}
                    alt={user?.username || "Profile"}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/80 shadow-md transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = "/assets/default-profile.png";
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-orange-600 flex items-center justify-center shadow-xs">
                    <Camera size={10} />
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <input
                    type="file"
                    id="navbarProfileUpload"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    accept="image/jpeg,image/png,image/webp"
                  />
                </label>

                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-black text-base truncate font-headline">
                      {user?.username || "User"}
                    </p>
                    <span className="bg-white/20 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0">
                      Pro
                    </span>
                  </div>
                  <p className="text-xs text-orange-100 truncate opacity-90">{user?.email}</p>
                </div>
              </div>

              {/* Quick Links inside Profile Header */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-white/20 text-center">
                <Link
                  href="/dashboard"
                  onClick={() => setIsSidebarOpen(false)}
                  className="py-1.5 px-3 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <FaTachometerAlt size={11} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/update-profile"
                  onClick={() => setIsSidebarOpen(false)}
                  className="py-1.5 px-3 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <FaUserAlt size={10} />
                  <span>Edit Profile</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white p-5 shadow-lg space-y-3">
              <div>
                <h4 className="font-headline font-black text-base">Meal Mates AI</h4>
                <p className="text-xs text-orange-100">Personalized AI nutrition & meal planning.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setIsSidebarOpen(false)}
                  className="py-2 px-3 bg-white text-orange-600 rounded-xl text-xs font-bold text-center shadow-xs transition hover:bg-orange-50"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsSidebarOpen(false)}
                  className="py-2 px-3 bg-orange-950/40 text-white rounded-xl text-xs font-bold text-center border border-white/20 transition hover:bg-orange-950/60"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}

            {/* Categorized Menu List */}
            <div className="space-y-5">
              {sidebarSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block px-2">
                    {section.title}
                  </span>
                  <div className="space-y-1">
                    {section.items.map(({ to, label, icon, badge, highlight }) => {
                      const isActive = pathname === to;
                      return (
                        <Link
                          key={to}
                          href={to}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 group ${
                            isActive
                              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20 transform -translate-y-0.5"
                              : highlight
                              ? "bg-orange-50/80 text-orange-600 hover:bg-orange-100/80 border border-orange-200/70"
                              : "text-gray-700 hover:bg-orange-50/60 hover:text-orange-600"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-sm sm:text-base ${
                                isActive ? "text-white" : highlight ? "text-orange-500" : "text-orange-500/80 group-hover:text-orange-500"
                              }`}
                            >
                              {icon}
                            </span>
                            <span>{label}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {badge && (
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                                  isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {badge}
                              </span>
                            )}
                            <ChevronRight
                              className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
                                isActive ? "text-white" : "text-gray-400 group-hover:text-orange-500"
                              }`}
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tray Drawer Footer */}
          <div className="p-5 border-t border-orange-100 bg-gray-50/60 space-y-2">
            {user ? (
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  setIsLogoutModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-xs sm:text-sm font-extrabold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <FiLogOut className="text-base" />
                <span>Log Out Account</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex-1 py-2.5 bg-white text-gray-800 font-bold text-xs text-center rounded-xl border border-gray-200 shadow-2xs hover:bg-gray-50 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex-1 py-2.5 bg-orange-500 text-white font-bold text-xs text-center rounded-xl shadow-xs hover:bg-orange-600 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <p className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest pt-1">
              Meal Mate AI &bull; Version 2.4 Pro
            </p>
          </div>
        </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-sm border border-orange-100 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <FiLogOut size={24} />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 font-headline">Confirm Logout</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to sign out of your Meal Mate account? Your preferences and saved plans remain securely stored.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  handleLogout();
                }}
                className="px-6 py-2.5 rounded-full text-xs font-extrabold text-white bg-red-500 hover:bg-red-600 transition shadow-md shadow-red-500/20"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
