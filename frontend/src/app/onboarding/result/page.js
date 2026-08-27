"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaCheckCircle, FaChevronRight, FaUtensils } from "react-icons/fa";

export default function OnboardingResult() {
  const router = useRouter();
  const [calories, setCalories] = useState(2000);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedCal = sessionStorage.getItem("onboarding_result_calories");
      if (savedCal) {
        setCalories(Math.round(Number(savedCal)));
      }
    }
  }, []);

  const protein = Math.round((calories * 0.3) / 4);
  const carbs = Math.round((calories * 0.45) / 4);
  const fats = Math.round((calories * 0.25) / 9);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-warm relative">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50 overflow-hidden">
        <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-primary-fixed-dim filter blur-[130px] opacity-20"></div>
        <div className="absolute bottom-[-15%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-secondary-container filter blur-[130px] opacity-25"></div>
      </div>

      <main className="relative z-10 w-full max-w-[600px] bg-white rounded-[28px] p-8 md:p-10 shadow-solaris border border-primary/5 flex flex-col items-center text-center space-y-8 animate-entrance">
        <div className="text-primary">
          <FaCheckCircle size={64} className="animate-bounce" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-charcoal-text font-headline">Calibration Complete!</h2>
          <p className="text-sm text-on-surface-variant font-medium">
            Your customized metabolic numbers have been saved to your profile.
          </p>
        </div>

        {/* Large Calorie Target display */}
        <div className="w-full bg-surface-warm rounded-2xl p-6 border border-primary/5 shadow-inner">
          <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">
            Recommended Daily Intake
          </span>
          <h3 className="text-5xl font-extrabold text-primary font-headline mt-2 leading-none">
            {calories.toLocaleString()}{" "}
            <span className="text-lg font-bold text-charcoal-text tracking-wide">KCAL</span>
          </h3>
        </div>

        {/* Macro Targets grid */}
        <div className="w-full grid grid-cols-3 gap-4">
          <div className="bg-surface-warm p-4 rounded-xl border border-primary/5">
            <span className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase">Protein</span>
            <p className="text-lg font-extrabold text-secondary mt-1">{protein}g</p>
            <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">30% split</p>
          </div>
          <div className="bg-surface-warm p-4 rounded-xl border border-primary/5">
            <span className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase">Carbs</span>
            <p className="text-lg font-extrabold text-tertiary-container mt-1">{carbs}g</p>
            <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">45% split</p>
          </div>
          <div className="bg-surface-warm p-4 rounded-xl border border-primary/5">
            <span className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase">Fats</span>
            <p className="text-lg font-extrabold text-primary-container mt-1">{fats}g</p>
            <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">25% split</p>
          </div>
        </div>

        {/* Action button triggers */}
        <div className="w-full flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/dashboard"
            className="flex-1 h-14 bg-surface border border-outline-variant/30 hover:bg-surface-warm text-charcoal-text font-bold text-sm rounded-full flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/meal-planner"
            className="flex-1 h-14 bg-primary hover:bg-orange-600 text-white font-bold text-sm rounded-full flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <FaUtensils size={14} />
            <span>Generate Meal Plan</span>
            <FaChevronRight size={12} />
          </Link>
        </div>
      </main>
    </div>
  );
}
