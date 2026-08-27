"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { toast } from "react-toastify";
import useWizardStore from "../../store/wizardStore";
import { motion } from "framer-motion";
import {
  FaCalculator,
  FaMars,
  FaVenus,
  FaArrowRight,
  FaCheck,
} from "react-icons/fa";

export default function CaloriesApplication() {
  const router = useRouter();
  const { setDailyCalories, setWeightGoal } = useWizardStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    gender: "Male",
    age: "25",
    height: "175",
    weight: "72",
    activityLevel: "moderate",
    goal: "weight_loss",
  });

  const activityOptions = [
    {
      value: "sedentary",
      label: "Sedentary",
      desc: "Desk routine, minimal movement",
      icon: "🛋️",
      activeBg: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/25",
    },
    {
      value: "light",
      label: "Light Active",
      desc: "1-2 light workouts / week",
      icon: "🚶‍♂️",
      activeBg: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-teal-500/25",
    },
    {
      value: "moderate",
      label: "Moderate",
      desc: "3-5 gym / sports sessions",
      icon: "🏃‍♂️",
      activeBg: "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-500/25",
    },
    {
      value: "active",
      label: "Very Active",
      desc: "6-7 intense workout days",
      icon: "⚡",
      activeBg: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/25",
    },
    {
      value: "very_active",
      label: "Athlete",
      desc: "Daily heavy physical work",
      icon: "🔥",
      activeBg: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25",
    },
  ];

  const goalOptions = [
    {
      value: "weight_loss",
      label: "Weight Loss",
      desc: "500 kcal safe fat deficit",
      badge: "Deficit",
      icon: "📉",
      glow: "from-orange-500 to-amber-600",
      badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
    },
    {
      value: "maintain",
      label: "Maintain",
      desc: "Metabolic equilibrium",
      badge: "Maintain",
      icon: "⚖️",
      glow: "from-emerald-500 to-teal-600",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    {
      value: "weight_gain",
      label: "Muscle Gain",
      desc: "Lean hypertrophy surplus",
      badge: "Surplus",
      icon: "📈",
      glow: "from-purple-600 to-indigo-600",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Quick Estimated Metrics for 3D Preview
  const heightM = (Number(form.height) || 175) / 100;
  const weightKg = Number(form.weight) || 72;
  const estimatedBMI = heightM > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : 23.5;
  const estimatedBMR = Math.round(
    form.gender === "Male"
      ? 10 * weightKg + 6.25 * (Number(form.height) || 175) - 5 * (Number(form.age) || 25) + 5
      : 10 * weightKg + 6.25 * (Number(form.height) || 175) - 5 * (Number(form.age) || 25) - 161
  );

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!form.age || !form.height || !form.weight) {
      toast.error("Please provide your age, height, and weight.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        gender: form.gender,
        age: Number(form.age),
        height: Number(form.height),
        weight: Number(form.weight),
        activityLevel: form.activityLevel,
        weightGoal: form.goal,
      };

      const { data } = await api.put("/users/calories", payload);
      const cals = Math.round(data?.dailyCalories || 2000);

      setDailyCalories(cals);
      setWeightGoal(form.goal);

      toast.success("Metabolic profile calibrated successfully! ✨");
      router.push("/calories-result");
    } catch (err) {
      toast.error(err.response?.data?.message || "Calculation failed. Check entries.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] py-6 sm:py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center select-none overflow-hidden">
      {/* 3D Ambient Glowing Background Spheres */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-orange-400/15 rounded-full blur-[90px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-400/15 rounded-full blur-[90px] pointer-events-none -z-10 animate-pulse" />

      <div className="max-w-3xl w-full space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 shadow-xs text-orange-600 text-xs font-bold uppercase tracking-wider">
            <span>AI Calorie & Macro Calculator</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 font-headline tracking-tight">
            Calculate Your Calorie Target
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm max-w-md mx-auto font-medium leading-relaxed">
            Enter your physiological details to calculate your personalized daily calorie and macro goals.
          </p>
        </motion.div>

        {/* Live Biometric Ticker */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white/70 backdrop-blur-xl p-3 rounded-2xl border border-white/80 shadow-md shadow-orange-500/5"
        >
          <div className="text-center p-2 rounded-xl bg-white/80 border border-orange-100/60 shadow-xs">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Est. BMR</span>
            <span className="text-sm sm:text-base font-black text-orange-600 font-headline">~{estimatedBMR} kcal</span>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/80 border border-orange-100/60 shadow-xs">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Est. BMI</span>
            <span className="text-sm sm:text-base font-black text-emerald-600 font-headline">{estimatedBMI}</span>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/80 border border-orange-100/60 shadow-xs">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Target Goal</span>
            <span className="text-xs font-black text-purple-600 capitalize truncate block">
              {form.goal.replace("_", " ")}
            </span>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/80 border border-orange-100/60 shadow-xs">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Activity Tier</span>
            <span className="text-xs font-black text-amber-600 capitalize truncate block">
              {form.activityLevel}
            </span>
          </div>
        </motion.div>

        {/* 3D Glassmorphic Form Card */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          onSubmit={handleCalculate}
          className="bg-white/90 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 border border-white/80 shadow-xl shadow-orange-500/10 space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500" />

          {/* 1. GENDER SELECTION */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Select Gender</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setForm({ ...form, gender: "Male" })}
                className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-extrabold text-xs sm:text-sm transition-all duration-200 relative ${
                  form.gender === "Male"
                    ? "border-sky-500 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25"
                    : "border-gray-200/80 bg-white/80 text-gray-700 hover:border-sky-300 hover:bg-sky-50/30"
                }`}
              >
                <FaMars size={16} />
                <span>Male</span>
                {form.gender === "Male" && <FaCheck className="absolute right-3.5 text-xs text-white" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setForm({ ...form, gender: "Female" })}
                className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-extrabold text-xs sm:text-sm transition-all duration-200 relative ${
                  form.gender === "Female"
                    ? "border-rose-500 bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25"
                    : "border-gray-200/80 bg-white/80 text-gray-700 hover:border-rose-300 hover:bg-rose-50/30"
                }`}
              >
                <FaVenus size={16} />
                <span>Female</span>
                {form.gender === "Female" && <FaCheck className="absolute right-3.5 text-xs text-white" />}
              </motion.button>
            </div>
          </div>

          {/* 2. PHYSIOLOGICAL INPUTS (Age, Height, Weight) */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
              Physiological Inputs
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Age */}
              <div className="bg-white/80 p-3 rounded-2xl border border-orange-100/90 shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase">
                  <span>🎂 Age</span>
                  <span className="text-orange-600 font-black">Years</span>
                </div>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="25"
                  min="10"
                  max="100"
                  required
                  className="w-full h-10 px-3 bg-gray-50/80 rounded-xl border border-gray-200 text-gray-900 font-black text-base focus:outline-none focus:border-orange-500 focus:bg-white text-center"
                />
              </div>

              {/* Height */}
              <div className="bg-white/80 p-3 rounded-2xl border border-orange-100/90 shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase">
                  <span>📏 Height</span>
                  <span className="text-emerald-600 font-black">cm</span>
                </div>
                <input
                  type="number"
                  name="height"
                  value={form.height}
                  onChange={handleChange}
                  placeholder="175"
                  min="80"
                  max="240"
                  required
                  className="w-full h-10 px-3 bg-gray-50/80 rounded-xl border border-gray-200 text-gray-900 font-black text-base focus:outline-none focus:border-orange-500 focus:bg-white text-center"
                />
              </div>

              {/* Weight */}
              <div className="bg-white/80 p-3 rounded-2xl border border-orange-100/90 shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase">
                  <span>⚖️ Weight</span>
                  <span className="text-purple-600 font-black">kg</span>
                </div>
                <input
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="72"
                  min="30"
                  max="250"
                  required
                  className="w-full h-10 px-3 bg-gray-50/80 rounded-xl border border-gray-200 text-gray-900 font-black text-base focus:outline-none focus:border-orange-500 focus:bg-white text-center"
                />
              </div>
            </div>
          </div>

          {/* 3. ACTIVITY LEVEL TILES */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
              Activity Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {activityOptions.map((opt) => {
                const isSelected = form.activityLevel === opt.value;
                return (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, activityLevel: opt.value })}
                    className={`p-2.5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? `${opt.activeBg} border-transparent shadow-md`
                        : "border-gray-200/80 bg-white/80 hover:bg-orange-50/30 hover:border-orange-200"
                    }`}
                  >
                    <span className="text-xl mb-1">{opt.icon}</span>
                    <div>
                      <p className={`text-[11px] font-black font-headline ${isSelected ? "text-white" : "text-gray-900"}`}>
                        {opt.label}
                      </p>
                      <p className={`text-[9px] font-medium leading-tight mt-0.5 line-clamp-1 ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                        {opt.desc}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* 4. MINIMAL COMPACT TARGET GOAL CARDS */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
              Target Goal
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {goalOptions.map((opt) => {
                const isSelected = form.goal === opt.value;
                return (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, goal: opt.value })}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between gap-3 relative overflow-hidden ${
                      isSelected
                        ? `bg-gradient-to-br ${opt.glow} border-transparent text-white shadow-md shadow-orange-500/20`
                        : "border-gray-200/80 bg-white/80 hover:bg-orange-50/40 hover:border-orange-200 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{opt.icon}</span>
                      <div className="min-w-0">
                        <h4 className={`text-xs sm:text-sm font-black font-headline truncate ${isSelected ? "text-white" : "text-gray-900"}`}>
                          {opt.label}
                        </h4>
                        <p className={`text-[10px] font-medium truncate ${isSelected ? "text-white/90" : "text-gray-500"}`}>
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                      isSelected ? "bg-white/25 border-white/30 text-white" : opt.badgeColor
                    }`}>
                      {opt.badge}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* 5. SUBMIT CTA */}
          <div className="pt-2 text-center">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-full px-10 py-3.5 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-200 active:scale-95 group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Calibrating...</span>
                </div>
              ) : (
                <>
                  <FaCalculator size={14} />
                  <span>Calculate Calorie & Macro Target</span>
                  <FaArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
