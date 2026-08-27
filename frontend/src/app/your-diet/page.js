"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaLeaf, FaAllergies, FaUtensils, FaArrowRight, FaCheckCircle } from "react-icons/fa";

export default function YourDietPage() {
  const dietFeatures = [
    {
      icon: <FaLeaf size={24} />,
      title: "Dietary Preferences",
      desc: "Customize your eating style, cultural favorites, and daily routine targets to fit Pakistani living.",
      items: ["Desi cuisine focus", "Keto & low carb options", "Vegetarian & vegan support"],
    },
    {
      icon: <FaAllergies size={24} />,
      title: "Allergies & Exclusions",
      desc: "Strictly exclude raw ingredients (e.g. peanuts, dairy, gluten) to guarantee 100% allergy safety.",
      items: ["Zero allergen violations", "Ingredient replacement", "Medical safety bounds"],
    },
    {
      icon: <FaUtensils size={24} />,
      title: "Cuisine Selections",
      desc: "Choose local desi options, continental dishes, or athletic high-protein macro splits.",
      items: ["Karahi, Daal & Biryani", "High-protein recipes", "Under-30-min prep times"],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12 text-gray-800">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
          Step 1 of 3
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 font-headline">
          Your Diet & Preferences
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-lg mx-auto">
          We curate meal plans based on your choices. Select preferences to optimize ingredients and taste.
        </p>
      </div>

      {/* Options List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dietFeatures.map((f, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15 }}
            className="bg-white rounded-3xl p-7 border border-orange-100 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-headline">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">{f.desc}</p>

              <div className="space-y-1.5 pt-2 border-t border-orange-50">
                {f.items.map((it, i) => (
                  <p key={i} className="text-xs text-gray-600 font-medium flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-500 shrink-0" size={11} />
                    <span>{it}</span>
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
          href="/calories-application"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base rounded-full px-10 py-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <span>Continue to Health Profile</span>
          <FaArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
