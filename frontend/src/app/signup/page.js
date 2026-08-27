"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../lib/api";
import { toast } from "react-toastify";
import useAuthStore from "../../store/authStore";
import { auth, provider, signInWithPopup } from "../../config/firebaseConfig";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiArrowRight } from "react-icons/fi";

const videoPaths = Array.from({ length: 13 }, (_, i) => `/videos/${i + 1}.mp4`);

export default function Signup() {
  const router = useRouter();
  const { fetchUser, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [videoIndex, setVideoIndex] = useState(0);

  // Auto-rotating video slider
  useEffect(() => {
    const timer = setInterval(() => {
      setVideoIndex((prev) => (prev + 1) % videoPaths.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please accept the terms of service.");
      return;
    }

    setManualLoading(true);
    try {
      const { data } = await api.post("/auth/signup", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (data?.success) {
        localStorage.setItem("meal_mates_token", data.token);
        toast.success("Account created successfully!");
        await fetchUser();
        router.replace("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Try a different email.");
    } finally {
      setManualLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!auth || !provider) {
      toast.error("Google authentication service is initializing. Please try email signup or try again in a moment.");
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      const { data } = await api.post("/auth/google-login", {
        idToken: await googleUser.getIdToken(),
        email: googleUser.email,
        displayName: googleUser.displayName,
        photoURL: googleUser.photoURL,
      });

      if (data?.success) {
        localStorage.setItem("meal_mates_token", data.token);
        toast.success("Google account connected!");
        await fetchUser();
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Google Signup Error:", error);
      toast.error(error.response?.data?.message || "Google signup failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-[#faf5ef]">
      {/* Left Side: Brand Showcase Video Slider with Centered Logo */}
      <section className="hidden md:flex w-1/2 h-full relative items-center justify-center p-12 overflow-hidden bg-black select-none">
        <AnimatePresence mode="wait">
          <motion.video
            key={videoPaths[videoIndex]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            autoPlay
            muted
            playsInline
            onEnded={() => setVideoIndex((prev) => (prev + 1) % videoPaths.length)}
            className="absolute inset-0 w-full h-full object-cover scale-105"
            src={videoPaths[videoIndex]}
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/80 z-10 pointer-events-none"></div>

        {/* Centered Brand Experience */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6"
        >
          {/* Glowing Circular Logo Emblem */}
          <Link href="/" className="relative group cursor-pointer block">
            <div className="absolute -inset-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
            <img
              src="/assets/logo.png"
              alt="Meal Mates Logo"
              className="relative w-36 h-36 rounded-full object-cover shadow-2xl border-4 border-white/90 transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.target.src = "/assets/full logo.png";
              }}
            />
          </Link>

          {/* Centered Brand Title with Superscript AI */}
          <div>
            <h1 className="text-4xl font-black text-orange-500 font-headline drop-shadow-[0_0_12px_rgba(255,140,0,0.6)] inline-flex items-baseline justify-center">
              Meal Mates<sup className="text-sm font-black uppercase text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] ml-1">AI</sup>
            </h1>
            <p className="text-xs font-semibold text-gray-200 mt-2 max-w-xs mx-auto leading-relaxed">
              Join thousands eating smarter with AI nutrition models tailored for Pakistani cuisine.
            </p>
          </div>
        </motion.div>

        {/* Video Slider Dots */}
        <div className="absolute bottom-6 left-8 z-20 flex items-center gap-1.5">
          {videoPaths.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setVideoIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === videoIndex ? "w-6 bg-orange-500" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Right Side: Enhanced Premium Signup Form Container */}
      <section className="w-full md:w-1/2 h-full flex flex-col items-center justify-center p-4 sm:p-8 md:p-10 bg-gradient-to-br from-[#faf5ef] via-white to-orange-50/30 relative overflow-y-auto">
        {/* Ambient Decorative Glows */}
        <div className="absolute top-1/4 -right-12 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden w-full max-w-md mb-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="Logo" className="w-8 h-8 rounded-full object-cover shadow" />
            <span className="text-lg font-black text-orange-500 font-headline">
              Meal Mates<sup className="text-[10px] font-black text-black ml-0.5">AI</sup>
            </span>
          </Link>
          <Link href="/login" className="text-xs font-bold text-orange-500 hover:underline">
            Sign In
          </Link>
        </div>

        {/* Premium Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-7 sm:p-9 border border-orange-100/90 shadow-xl shadow-orange-500/5 space-y-5"
        >
          {/* Header */}
          <div className="space-y-1.5 text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-headline tracking-tight">
              Create Account
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Start your customized meal planning, macro calibration, and health journey.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block" htmlFor="username">
                Full Name / Username
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                  <FiUser size={16} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. Ali Khan"
                  className="w-full h-11 pl-10 pr-4 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 text-xs font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                  <FiMail size={16} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full h-11 pl-10 pr-4 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 text-xs font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                  <FiLock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-11 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 text-xs font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Terms of Service */}
            <div className="flex items-center space-x-2 pt-0.5">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer accent-orange-500"
              />
              <label htmlFor="terms" className="text-[11px] text-gray-500 font-medium cursor-pointer select-none">
                I agree to the{" "}
                <Link href="/terms" className="text-orange-500 font-bold hover:underline">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-orange-500 font-bold hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={manualLoading}
              className="w-full h-11 bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
            >
              <span>{manualLoading ? "Creating Account..." : "Create Account"}</span>
              <FiArrowRight size={14} />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              or continue with
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="w-full h-11 bg-white hover:bg-orange-50/30 border border-gray-200 hover:border-orange-300 rounded-full text-xs font-bold text-gray-700 flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all active:scale-[0.99] cursor-pointer"
          >
            <FcGoogle size={18} />
            <span>{googleLoading ? "Connecting to Google..." : "Sign Up with Google"}</span>
          </button>

          {/* Footer Link */}
          <p className="text-center text-xs text-gray-500 font-medium pt-1">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-orange-500 font-bold hover:text-orange-600 transition-all ml-1 underline decoration-orange-200 hover:decoration-orange-500"
            >
              Sign In
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}
