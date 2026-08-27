"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import useWizardStore from "../../store/wizardStore";
import {
  FaFire,
  FaChartLine,
  FaUtensils,
  FaArrowRight,
  FaTint,
  FaDumbbell,
  FaBreadSlice,
  FaCheckCircle,
  FaLanguage,
} from "react-icons/fa";

export default function CaloriesResult() {
  const { dailyCalories, weightGoal } = useWizardStore();
  const [mounted, setMounted] = useState(false);
  const [selectedLang, setSelectedLang] = useState("both"); // 'both', 'en', 'ur'

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target = dailyCalories || 2200;
  const isLoss = weightGoal === "weight_loss" || !weightGoal;
  const isGain = weightGoal === "weight_gain";

  // Macro target calculations
  const proteinGrams = Math.round((target * 0.30) / 4);
  const carbsGrams = Math.round((target * 0.45) / 4);
  const fatGrams = Math.round((target * 0.25) / 9);

  // Meal breakdown allocations
  const breakfastCals = Math.round(target * 0.25);
  const lunchCals = Math.round(target * 0.35);
  const dinnerCals = Math.round(target * 0.30);
  const snackCals = Math.round(target * 0.10);

  // Bilingual Nutrition Tips
  const tipsEn = isLoss
    ? [
        "Maintain a steady calorie deficit to safely burn body fat while preserving lean muscle.",
        "Prioritize protein in every meal (eggs, chicken breast, lentils, fish) to stay full longer.",
        "Drink at least 2.5 to 3 Litres of water daily, especially 1 glass before meals to control appetite.",
        "Limit refined sugars and fried snacks; replace them with seasonal green vegetables & salads.",
      ]
    : isGain
    ? [
        "Consume a 500 kcal surplus daily to promote healthy muscle growth without excessive fat.",
        "Eat nutrient and calorie-dense healthy foods like almonds, walnuts, peanut butter, eggs, and chicken.",
        "Have 4 to 5 smaller meals spread across the day rather than 2 oversized meals.",
        "Stay consistently hydrated with 3+ Litres of fluids and healthy fruit/milk shakes.",
      ]
    : [
        "Consume your exact maintenance calories to sustain energy levels and peak vitality.",
        "Focus on whole food sources: colorful vegetables, whole grains, and lean proteins.",
        "Maintain adequate hydration with 2.5 Litres of water daily.",
        "Keep an active routine with 30-45 minutes of daily physical activity.",
      ];

  const tipsUr = isLoss
    ? [
        "وزن کم کرنے کے لیے روزانہ کیلوریز کا محفوظ خسارہ برقرار رکھیں تاکہ چربی کم ہو اور پٹھے محفوظ رہیں۔",
        "ہر کھانے میں پروٹین (انڈے، چکن، دالیں، مچھلی) کو ترجیح دیں تاکہ بھوک کنٹرول میں رہے۔",
        "روزانہ کم از کم 2.5 سے 3 لیٹر پانی ضرور پیئیں، خاص طور پر کھانے سے پہلے ایک گلاس پانی پیئیں۔",
        "میٹھے مشروبات اور چینی سے پرہیز کریں اور سلاد و سبزیوں کا استعمال بڑھائیں۔",
      ]
    : isGain
    ? [
        "وزن اور پٹھے بڑھانے کے لیے روزانہ مناسب اضافی کیلوریز (Surplus) استعمال کریں۔",
        "غذائیت سے بھرپور غذائیں کھائیں جیسے بادام، اخروٹ، پی نٹ بٹر، انڈے، چکن اور شیکس۔",
        "دن میں 2 بڑے کھانوں کے بجائے 4 سے 5 چھوٹے کھانے کھائیں۔",
        "روزانہ کم از کم 3 لیٹر پانی اور صحت مند مشروبات پیئیں۔",
      ]
    : [
        "اپنا موجودہ وزن برقرار رکھنے کے لیے روزانہ متوازن مقدار میں کیلوریز کھائیں۔",
        "صحت بخش اور قدرتی کھانوں پر توجہ دیں: رنگ برنگی سبزیاں، دالیں اور خالص پروٹین۔",
        "روزانہ 2.5 لیٹر پانی پینے کا معمول بنائیں۔",
        "روزانہ 30 سے 45 منٹ کی معتدل ورزش یا چہل قدمی کریں۔",
      ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 px-4 py-8 text-gray-800">
      {/* Title */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-500 shadow-sm"
        >
          <FaCheckCircle size={32} />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-orange-500 font-headline">
          Your Daily Calorie Needs
        </h1>
        <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto">
          Based on your biometrics, here is your personalized daily energy and macro blueprint:
        </p>
      </div>

      {/* Main Calorie Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 border border-orange-100 shadow-lg text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -z-10 blur-3xl opacity-60" />

        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Recommended Daily Target
        </p>
        <div className="flex items-center justify-center gap-2 text-orange-500 my-3">
          <FaFire className="animate-pulse" size={36} />
          <span className="text-6xl md:text-7xl font-black font-headline tracking-tight">
            {target.toLocaleString()}
          </span>
          <span className="text-lg font-bold text-gray-700 self-end mb-2">kcal / day</span>
        </div>

        {/* Macro Distribution Cards */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-8">
          <div className="bg-orange-50/80 p-4 rounded-2xl border border-orange-100">
            <span className="text-xs font-bold text-orange-500 uppercase block mb-1">Protein</span>
            <p className="text-2xl font-black text-gray-900">{proteinGrams}g</p>
            <p className="text-[11px] text-gray-500 font-medium">30% split</p>
          </div>
          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-100">
            <span className="text-xs font-bold text-amber-600 uppercase block mb-1">Carbs</span>
            <p className="text-2xl font-black text-gray-900">{carbsGrams}g</p>
            <p className="text-[11px] text-gray-500 font-medium">45% split</p>
          </div>
          <div className="bg-yellow-50/80 p-4 rounded-2xl border border-yellow-100">
            <span className="text-xs font-bold text-yellow-600 uppercase block mb-1">Fats</span>
            <p className="text-2xl font-black text-gray-900">{fatGrams}g</p>
            <p className="text-[11px] text-gray-500 font-medium">25% split</p>
          </div>
        </div>
      </motion.div>

      {/* Meal Breakdown Grid */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 font-headline flex items-center gap-2">
          <FaUtensils className="text-orange-500" />
          <span>Meal-by-Meal Calorie Distribution</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Breakfast", cals: breakfastCals, share: "25%" },
            { label: "Lunch", cals: lunchCals, share: "35%" },
            { label: "Dinner", cals: dinnerCals, share: "30%" },
            { label: "Snack / Tea", cals: snackCals, share: "10%" },
          ].map((m) => (
            <div key={m.label} className="bg-white p-5 rounded-2xl border border-orange-50 shadow-sm text-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{m.label}</p>
              <p className="text-2xl font-extrabold text-orange-500 my-1">{m.cals}</p>
              <p className="text-[11px] text-gray-400 font-medium">{m.share} of daily intake</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bilingual AI Nutrition Guidance (English & Urdu) */}
      <section className="bg-white rounded-3xl p-8 border border-orange-100 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-orange-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-headline">
              AI Nutritionist Guidance & Tips
            </h3>
            <p className="text-xs text-gray-500">Customized health rules for your daily routine</p>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-orange-50 p-1 rounded-full border border-orange-200 text-xs font-bold">
            <button
              onClick={() => setSelectedLang("both")}
              className={`px-3 py-1 rounded-full transition ${
                selectedLang === "both" ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:text-orange-500"
              }`}
            >
              Both (English & اردو)
            </button>
            <button
              onClick={() => setSelectedLang("en")}
              className={`px-3 py-1 rounded-full transition ${
                selectedLang === "en" ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:text-orange-500"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLang("ur")}
              className={`px-3 py-1 rounded-full transition ${
                selectedLang === "ur" ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:text-orange-500"
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        {/* English Guidelines */}
        {(selectedLang === "both" || selectedLang === "en") && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider">
              English Guidelines
            </h4>
            <ul className="space-y-2.5">
              {tipsEn.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                  <FaCheckCircle className="text-orange-500 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Urdu Guidelines */}
        {(selectedLang === "both" || selectedLang === "ur") && (
          <div className={`space-y-3 ${selectedLang === "both" ? "pt-4 border-t border-orange-50" : ""}`}>
            <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider text-right" dir="rtl">
              اردو میں غذائی رہنمائی
            </h4>
            <ul className="space-y-2.5" dir="rtl">
              {tipsUr.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-800 font-semibold leading-relaxed">
                  <FaCheckCircle className="text-orange-500 shrink-0 mt-1" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Continue CTA Button */}
      <div className="text-center pt-4">
        <Link
          href="/dietary-type"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base rounded-full px-10 py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <span>Select Dietary Preferences</span>
          <FaArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
