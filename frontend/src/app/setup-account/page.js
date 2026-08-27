"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaLeaf, FaUserAlt, FaUtensils, FaArrowRight, FaCheckCircle } from "react-icons/fa";

export default function SetupAccountPage() {
  const steps = [
    {
      step: "01",
      icon: <FaLeaf size={24} />,
      label: "Diet & Preferences",
      desc: "Tell us about your dietary preferences and cultural favorites. We'll customize your meal plans to match your lifestyle.",
      benefits: ["Personalized recommendations", "Pakistani cuisine options", "Customizable taste"],
    },
    {
      step: "02",
      icon: <FaUserAlt size={24} />,
      label: "Health Profile & Biometrics",
      desc: "Share your age, weight, height, and activity level. Our AI will calculate your optimal calorie target and macro needs.",
      benefits: ["Customized calorie goals", "BMR & TDEE calculation", "Activity-adjusted targets"],
    },
    {
      step: "03",
      icon: <FaUtensils size={24} />,
      label: "Daily Meal Schedule",
      desc: "Choose your preferred meal frequency and eating slots. We'll create a schedule that fits your daily routine.",
      benefits: ["Flexible meal timing", "Portion guidance", "Routine-based planning"],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12 text-gray-800">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
          3-Step Calibration
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 font-headline">
          Let&apos;s Setup Your Profile
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-lg mx-auto">
          We configure your metabolic parameters through three simple preference calibration steps.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15 }}
            className="bg-white rounded-3xl p-7 border border-orange-100 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  {s.icon}
                </div>
                <span className="text-xs font-extrabold text-orange-500 bg-orange-50 px-3 py-1 rounded-full uppercase">
                  Step {s.step}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 font-headline">{s.label}</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">{s.desc}</p>

              <div className="space-y-1.5 pt-2 border-t border-orange-50">
                {s.benefits.map((b, i) => (
                  <p key={i} className="text-xs text-gray-600 font-medium flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-500 shrink-0" size={11} />
                    <span>{b}</span>
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Continue CTA */}
      <div className="text-center pt-4">
        <Link
          href="/your-diet"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base rounded-full px-10 py-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <span>Begin Setup Step 1</span>
          <FaArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
