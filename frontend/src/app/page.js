"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  FaArrowRight,
  FaArrowLeft,
  FaRobot,
  FaUtensils,
  FaAppleAlt,
  FaSave,
  FaClock,
  FaChartBar,
  FaUserAlt,
  FaQuestionCircle,
  FaFire,
  FaLeaf,
  FaBrain,
  FaStar,
  FaCheckCircle,
  FaTachometerAlt,
  FaCalculator,
  FaStore,
  FaInfoCircle,
  FaBookOpen,
  FaMagic,
} from "react-icons/fa";
import { Menu, X, ChevronRight } from "lucide-react";
import { FiLogOut } from "react-icons/fi";
import Footer from "../components/Footer";

const videoPaths = Array.from({ length: 13 }, (_, i) => `/videos/${i + 1}.mp4`);

// ─── Carousel Arrows ─────────────────────────────────────────────────────────
const NextArrow = ({ onClick }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="hidden sm:flex absolute right-[-20px] lg:right-[-44px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white hover:bg-orange-50 text-orange-500 rounded-full shadow-md border border-orange-100 items-center justify-center transition-all cursor-pointer"
    aria-label="Next slide"
  >
    <FaArrowRight size={14} />
  </button>
);

const PrevArrow = ({ onClick }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="hidden sm:flex absolute left-[-20px] lg:left-[-44px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white hover:bg-orange-50 text-orange-500 rounded-full shadow-md border border-orange-100 items-center justify-center transition-all cursor-pointer"
    aria-label="Previous slide"
  >
    <FaArrowLeft size={14} />
  </button>
);


export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [videoIndex, setVideoIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarRef = useRef(null);

  const [formData, setFormData] = useState({ username: "", email: "", feedback: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userFeedbacks, setUserFeedbacks] = useState([]);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    setVideoIndex(Math.floor(Math.random() * videoPaths.length));
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("feedbackFormData");
      if (saved) setFormData(JSON.parse(saved));
    }
  }, []);

  // Change video on click
  const handleGlobalClick = useCallback(() => {
    setVideoIndex((prev) => {
      let next;
      do { next = Math.floor(Math.random() * videoPaths.length); }
      while (next === prev && videoPaths.length > 1);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [handleGlobalClick]);

  // ── Scroll-hide Nav (only hide when NOT at top) ─────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setIsNavVisible(current <= 10);
      setLastScrollY(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Click outside sidebar ───────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target) && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  // ── Fetch feedbacks ─────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/feedback/all").then((res) => {
      if (Array.isArray(res.data.feedbacks)) {
        setUserFeedbacks(res.data.feedbacks.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
      }
    }).catch(() => {});
  }, []);

  // ── Form ────────────────────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.feedback.trim()) newErrors.feedback = "Message is required";
    else if (formData.feedback.length > 300) newErrors.feedback = "Max 300 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    if (typeof window !== "undefined") localStorage.setItem("feedbackFormData", JSON.stringify(updated));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error("Please login to submit feedback!"); router.push("/login"); return; }
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await api.post("/feedback/submit", { username: formData.username, email: formData.email, message: formData.feedback });
      if (res.status === 201) {
        setIsSubmitted(true);
        toast.success("Feedback submitted!");
        const empty = { username: "", email: "", feedback: "" };
        setFormData(empty);
        localStorage.setItem("feedbackFormData", JSON.stringify(empty));
        setUserFeedbacks((p) => [...p, { username: formData.username, email: formData.email, message: formData.feedback, profileImage: "/assets/default-profile.png", submittedAt: new Date() }]);
        setTimeout(() => setIsSubmitted(false), 3000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback.");
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await logout(); toast.success("Logged out!"); router.push("/login"); }
    catch { toast.error("Logout failed."); }
  };

  // ── Static data ─────────────────────────────────────────────────────────────
  const dummyFeedbacks = [
    { username: "Sarah Ahmed", message: "Meal Mates transformed my meal planning! The personalized recipes are delicious and perfectly aligned with my health goals.", profileImage: "/assets/sarah.jpg", submittedAt: new Date("2024-03-15") },
    { username: "Mohammad Khan", message: "As a busy professional, this app has been a game-changer. The meal suggestions are spot-on, and I love how it considers my dietary preferences.", profileImage: "/assets/khan.jpg", submittedAt: new Date("2024-03-14") },
    { username: "Fatima Zahra", message: "The variety of recipes is amazing! I've discovered so many new healthy dishes that my whole family enjoys. The nutrition tracking is incredible.", profileImage: "/assets/fatima.jpg", submittedAt: new Date("2024-03-13") },
    { username: "Ali Hassan", message: "The interface is intuitive, and the recipes are both healthy and delicious. A must-have for health-conscious individuals!", profileImage: "/assets/Ali.jpg", submittedAt: new Date("2024-03-12") },
    { username: "Ayesha Malik", message: "Personalized meal plans helped me achieve my fitness goals while enjoying my food. The user-friendly design makes it a pleasure to use daily.", profileImage: "/assets/ayesha.jpg", submittedAt: new Date("2024-03-11") },
  ];

  const feedbacksToShow = userFeedbacks.length > 0 ? [...dummyFeedbacks, ...userFeedbacks] : dummyFeedbacks;

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4500,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2, arrows: true } },
      { breakpoint: 640, settings: { slidesToShow: 1, arrows: false, dots: true } },
    ],
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════════════
          NAVBAR — Transparent over hero, hides on scroll, matches backup exactly
      ═══════════════════════════════════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 bg-transparent`}
        style={{ transform: isNavVisible ? "translateY(0)" : "translateY(-100%)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo with Meal Mates^AI text */}
          <Link href="/" className="flex items-center gap-2.5 group" onClick={(e) => e.stopPropagation()}>
            <img
              src="/assets/logo.png"
              alt="Meal Mates Logo"
              className="h-11 w-11 rounded-full object-cover shadow-md transition-transform group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              onError={(e) => { e.target.src = "/assets/full logo.png"; }}
            />
            <span className="text-3xl font-black tracking-tight text-orange-500 drop-shadow-[0_0_8px_rgba(255,140,0,0.6)] font-headline inline-flex items-baseline">
              Meal Mates<sup className="text-sm font-black uppercase text-black drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] ml-0.5">AI</sup>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex space-x-8 items-center">
            {navLinks.map(({ label, to }) => (
              <li key={label} className="group relative">
                <Link
                  href={to}
                  onClick={(e) => e.stopPropagation()}
                  className="text-white text-[15px] font-medium transition duration-300 hover:text-orange-400 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                >
                  {label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-400 transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Auth / Hamburger */}
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(!isSidebarOpen); }}
                className="text-white hover:text-orange-400 transition cursor-pointer p-1"
                aria-label="Open menu drawer"
              >
                <Menu className="w-7 h-7" />
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex items-center gap-3">
                  <Link
                    href="/login"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm font-bold text-white bg-white/10 hover:bg-orange-500 focus:outline-none rounded-full px-5 py-2 shadow-[0_0_15px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-300 border border-white/30 hover:shadow-[0_0_20px_rgba(255,165,0,0.6)]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none rounded-full px-5 py-2 shadow-[0_4px_20px_rgba(255,107,0,0.4)] transition-all duration-300"
                  >
                    Sign Up
                  </Link>
                </div>

                {/* Single Mobile hamburger when not logged in */}
                <button
                  className="md:hidden text-white hover:text-orange-400 transition p-1.5 rounded-lg bg-black/30 backdrop-blur-sm"
                  onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(!mobileMenuOpen); }}
                  aria-label="Toggle mobile menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/80 backdrop-blur-md border-t border-white/10 px-6 py-4 space-y-3"
            >
              {navLinks.map(({ label, to }) => (
                <Link
                  key={label}
                  href={to}
                  onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }}
                  className="block text-white font-medium text-base py-1 hover:text-orange-400 transition"
                >
                  {label}
                </Link>
              ))}
              {!user && (
                <div className="pt-2.5 border-t border-white/10 flex gap-2">
                  <Link
                    href="/login"
                    onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }}
                    className="flex-1 py-2 text-center text-xs font-bold text-white bg-white/10 hover:bg-orange-500 rounded-full border border-white/20 transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }}
                    className="flex-1 py-2 text-center text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-full transition"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[190] transition-opacity duration-300"
        />
      )}

      {/* ─── Modern Slide-out Tray Console (All Users) ─────────────────────────────────────────── */}
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
                <img
                  src={user?.profileImage || "/assets/default-profile.png"}
                  alt={user?.username || "Profile"}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/80 shadow-md"
                  onError={(e) => {
                    e.target.src = "/assets/default-profile.png";
                  }}
                />
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
                  {section.items.map(({ to, label, icon, badge, highlight }) => (
                    <Link
                      key={to}
                      href={to}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 group ${
                        highlight
                          ? "bg-orange-50/80 text-orange-600 hover:bg-orange-100/80 border border-orange-200/70"
                          : "text-gray-700 hover:bg-orange-50/60 hover:text-orange-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm sm:text-base ${highlight ? "text-orange-500" : "text-orange-500/80 group-hover:text-orange-500"}`}>
                          {icon}
                        </span>
                        <span>{label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {badge && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase bg-emerald-100 text-emerald-700">
                            {badge}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  ))}
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

      {/* ─── Logout Confirmation Modal ────────────────────────────────────────── */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-3">Confirm Logout</h2>
            <p className="text-gray-500 mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsLogoutModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 font-semibold transition">Cancel</button>
              <button onClick={() => { handleLogout(); setIsLogoutModalOpen(false); }} className="px-5 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 font-semibold transition">Log Out</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO — Full-screen video background + centered glassmorphism card
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video BG */}
        <div className="absolute inset-0 bg-black">
          <video
            key={videoIndex}
            src={videoPaths[videoIndex]}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-60"
            style={{ transition: "opacity 0.5s" }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        </div>


        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-24 pb-16">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="text-white space-y-6"
          >

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight font-headline drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
            >
              Your nutrition.<br />
              <span className="text-orange-400">Intelligently</span><br />
              <span className="text-orange-400">personalized.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-base md:text-lg text-gray-200 max-w-lg font-light leading-relaxed drop-shadow-sm"
            >
              Stop guessing what to eat. Our advanced AI crafts tailored meal plans, tracks your macros with precision, and adapts daily to your unique metabolic needs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Link
                href="/meal-planner"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-3 text-base font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-full px-8 py-4 shadow-[0_4px_20px_rgba(255,107,0,0.5)] hover:shadow-[0_4px_30px_rgba(255,107,0,0.7)] transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Start Your Plan <FaArrowRight size={14} />
              </Link>
              <Link
                href="/how-it-works"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 text-base font-bold text-white bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 rounded-full px-8 py-4 transition-all duration-300"
              >
                How It Works
              </Link>
            </motion.div>

            {/* Micro stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex flex-wrap gap-6 pt-4"
            >
              {[
                { label: "Active Users", value: "12,000+" },
                { label: "Meals Generated", value: "48,000+" },
                { label: "Avg. Goal Hit", value: "87%" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-gray-300 font-medium">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Clean food showcase image */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative hidden lg:flex items-center justify-center"
          >
            {/* Subtle warm glow behind */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-400/20 to-amber-300/10 blur-3xl scale-110" />

            {/* Single showcase image — translucent white background with subtle opacity */}
            <div className="relative z-10 w-[460px] max-w-full">
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/30 bg-white/15 backdrop-blur-md p-3">
                <img
                  src="/assets/Home.png"
                  alt="Meal Mate AI Experience"
                  className="w-full h-auto max-h-[440px] object-contain rounded-2xl opacity-80 transition-opacity duration-300 hover:opacity-95"
                  onError={(e) => {
                    e.target.src = "/assets/home.png";
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2">
            <div className="w-1.5 h-2.5 bg-white/60 rounded-full animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SOCIAL PROOF STRIP
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-gray-950 border-y border-gray-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest text-center mb-7">Trusted by Leading Health Communities</p>
          <div className="flex items-center justify-center gap-0 overflow-x-auto scrollbar-hide">
            {[
              { name: "TechHealth Daily", icon: "📱" },
              { name: "Nutrition Today", icon: "🥗" },
              { name: "WIRED Wellness", icon: "⚡" },
              { name: "Future of Food", icon: "🌿" },
              { name: "HealthPak Media", icon: "🩺" },
            ].map((pub, i, arr) => (
              <React.Fragment key={pub.name}>
                <div className="flex items-center gap-2 px-8 whitespace-nowrap">
                  <span className="text-xl">{pub.icon}</span>
                  <span className="text-[15px] font-bold text-white/85 hover:text-orange-400 transition-colors cursor-default tracking-wide">{pub.name}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px h-5 bg-white/20 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURES — 3 card bento with icon and description
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#fdf6f0]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">What We Offer</p>
            <h2 className="text-4xl font-extrabold text-gray-900 font-headline leading-tight">
              Everything you need to eat right
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">From AI-powered meal planning to detailed macro tracking — all optimized for Pakistani cuisine and dietary needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <FaFire className="text-orange-500" size={28} />,
                color: "bg-orange-50",
                title: "Macro Tracking",
                desc: "Monitor calories, protein, carbs, and fats with precision. Get real-time insights tailored to your body composition goals.",
                link: "/nutrition",
              },
              {
                icon: <FaLeaf className="text-green-500" size={28} />,
                color: "bg-green-50",
                title: "Recipe Discovery",
                desc: "Discover and browse healthy Pakistani recipes aligned with your dietary type — Keto, Vegan, Desi, or Mediterranean.",
                link: "/ingredients",
              },
              {
                icon: <FaBrain className="text-purple-500" size={28} />,
                color: "bg-purple-50",
                title: "AI Coaching",
                desc: "Chat with our AI nutritionist in English or Roman Urdu to get personalized advice, meal swaps, and metabolic insights.",
                link: "/chatbot",
              },
              {
                icon: <FaUtensils className="text-blue-500" size={28} />,
                color: "bg-blue-50",
                title: "Custom Meal Plans",
                desc: "Generate full weekly meal schedules from your biometrics — calories, BMI, activity level, and dietary restrictions.",
                link: "/meal-planner",
              },
              {
                icon: <FaChartBar className="text-pink-500" size={28} />,
                color: "bg-pink-50",
                title: "Progress Analytics",
                desc: "Track your health journey with beautiful charts showing weekly intake vs. targets, streaks, and achievements.",
                link: "/physical-stats",
              },
              {
                icon: <FaStar className="text-yellow-500" size={28} />,
                color: "bg-yellow-50",
                title: "Personalized For You",
                desc: "Our ML model learns your history and preferences to make increasingly better recommendations over time.",
                link: "/recommendations",
              },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={feat.link} onClick={(e) => e.stopPropagation()}>
                  <div className="bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-full">
                    <div className={`w-14 h-14 rounded-2xl ${feat.color} flex items-center justify-center mb-5`}>
                      {feat.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-orange-500 transition-colors">{feat.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS — 3 step numbered section
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-4xl font-extrabold text-gray-900 font-headline">Get started in 3 steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Enter Your Stats", desc: "Add your age, weight, height, activity level, and dietary goals to calibrate your profile." },
              { step: "02", title: "AI Builds Your Plan", desc: "Our ML model generates a personalized meal schedule with calories and macros calculated for you." },
              { step: "03", title: "Track & Optimize", desc: "Log meals, chat with the AI nutritionist, and watch your progress improve every week." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center mx-auto mb-5">
                  <span className="text-2xl font-black text-orange-500">{s.step}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/how-it-works"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 text-orange-500 font-bold hover:text-orange-600 transition-colors"
            >
              Learn more about how it works <FaArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          ABOUT TEASER — Split layout with image and text
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#fdf6f0]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <img
              src="/assets/mission.jpeg"
              alt="Our Mission"
              className="rounded-3xl w-full h-[400px] object-cover shadow-2xl"
            />
            <div className="absolute -bottom-6 -right-6 bg-orange-500 text-white rounded-2xl px-6 py-4 shadow-xl">
              <p className="text-2xl font-black">87%</p>
              <p className="text-xs font-semibold opacity-80">of users hit their goals</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">Our Mission</p>
            <h2 className="text-4xl font-extrabold text-gray-900 font-headline leading-tight">
              Built for Pakistani <span className="text-orange-500">health journeys</span>
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Meal Mate AI was built to solve a real problem — there are almost no AI nutrition platforms that understand Pakistani dietary culture. From Biryani to Daal Roti, we've trained our models on local cuisine to give you plans that are actually achievable.
            </p>
            <ul className="space-y-3">
              {["Trained on Pakistani food databases", "Roman Urdu AI consultation support", "Local grocery store integrations", "Medically informed macro targets"].map((pt) => (
                <li key={pt} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <FaCheckCircle className="text-orange-500 shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>
            <div className="flex gap-4 pt-2">
              <Link
                href="/about"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-7 py-3 transition-all shadow-md"
              >
                Read Our Story <FaArrowRight size={12} />
              </Link>
              <Link
                href="/contact"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-500 font-bold rounded-full px-7 py-3 transition-all"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TESTIMONIALS — Slider with profile photo + quote
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Real Stories</p>
            <h2 className="text-4xl font-extrabold text-gray-900 font-headline">What our users say</h2>
          </div>

          <div className="relative px-2 sm:px-10">
            <Slider {...carouselSettings}>
              {feedbacksToShow.map((fb, idx) => (
                <div key={idx} className="px-3 h-full">
                  <div className="bg-white rounded-3xl p-7 border border-orange-100 shadow-md flex flex-col items-center text-center min-h-[300px] h-full">
                    <img
                      src={fb.profileImage || "/assets/default-profile.png"}
                      alt={fb.username}
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-orange-200"
                      onError={(e) => { e.target.src = "/assets/default-profile.png"; }}
                    />
                    <h3 className="text-base font-bold text-orange-500 mb-1">{fb.username}</h3>
                    {fb.email && <p className="text-xs text-gray-400 mb-3">{fb.email}</p>}
                    <p className="text-gray-600 italic text-sm leading-relaxed line-clamp-4 flex-grow">
                      &ldquo;{fb.message}&rdquo;
                    </p>
                    <div className="flex gap-0.5 mt-4">
                      {[1,2,3,4,5].map((s) => <FaStar key={s} className="text-yellow-400" size={12} />)}
                    </div>
                    {fb.submittedAt && (
                      <p className="text-xs text-gray-300 mt-2">
                        {new Date(fb.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-white font-headline mb-4">
              Ready to eat smarter?
            </h2>
            <p className="text-white/80 text-base mb-8 max-w-md mx-auto">
              Join thousands who have transformed their health with AI-guided nutrition tailored just for them.
            </p>
            <Link
              href="/meal-planner"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-3 bg-white text-orange-500 font-extrabold text-base rounded-full px-10 py-4 shadow-2xl hover:shadow-white/30 hover:-translate-y-1 transition-all duration-300"
            >
              Build My Free Plan 🚀
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEEDBACK FORM SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#fdf6f0]">
        <div className="max-w-md mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Share Your Thoughts</p>
            <h2 className="text-3xl font-extrabold text-gray-900 font-headline">We'd love your feedback</h2>
            <p className="text-gray-500 mt-2 text-sm">Help us build better experiences for your nutrition journey.</p>
          </div>

          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl border border-orange-100 shadow-lg p-8 space-y-5"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Username <span className="text-orange-500">*</span>
                  </label>
                  <input
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full bg-gray-50 text-gray-800 rounded-xl border ${errors.username ? "border-red-400" : "border-gray-200"} focus:outline-none focus:ring-2 focus:ring-orange-300 px-4 py-3 text-sm`}
                  />
                  {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Email <span className="text-orange-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className={`w-full bg-gray-50 text-gray-800 rounded-xl border ${errors.email ? "border-red-400" : "border-gray-200"} focus:outline-none focus:ring-2 focus:ring-orange-300 px-4 py-3 text-sm`}
                  />
                  {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Message <span className="text-orange-500">*</span>
                  </label>
                  <textarea
                    name="feedback"
                    value={formData.feedback}
                    onChange={handleChange}
                    placeholder="Share your experience..."
                    rows={4}
                    maxLength={300}
                    className={`w-full bg-gray-50 text-gray-800 rounded-xl border ${errors.feedback ? "border-red-400" : "border-gray-200"} focus:outline-none focus:ring-2 focus:ring-orange-300 px-4 py-3 text-sm resize-none`}
                  />
                  <div className="flex justify-between">
                    {errors.feedback && <p className="text-red-500 text-xs">{errors.feedback}</p>}
                    <p className="text-xs text-gray-400 ml-auto">{formData.feedback.length}/300</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-full font-bold text-sm transition-all duration-300 ${loading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-orange-200"}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : "Submit Feedback"}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="text-center py-12 bg-white rounded-3xl border border-green-100 shadow-lg"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-green-500" size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h3>
                <p className="text-gray-500 text-sm">Your feedback has been submitted successfully.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
