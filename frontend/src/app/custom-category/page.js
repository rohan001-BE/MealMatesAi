"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaLeaf, FaFireAlt, FaArrowRight, FaBookmark, FaSearch } from "react-icons/fa";

export default function CustomCategoryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 text-gray-800">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
          Custom Recipe Generator
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-orange-500 font-headline">
          Choose Your Custom Meal Search
        </h1>
        <p className="text-gray-600 text-base max-w-md mx-auto">
          Select how you&apos;d like to generate your custom recipe tailored to your specific craving or fitness goals:
        </p>
      </div>

      {/* Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Option 1: By Ingredient & Restrictions */}
        <motion.div
          whileHover={{ y: -4, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          className="bg-white rounded-3xl p-8 border-2 border-orange-100 shadow-sm flex flex-col justify-between space-y-6 hover:border-orange-300 transition-all"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <FaLeaf size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 font-headline">
              By Ingredient & Restrictions
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Enter your favorite ingredient (e.g., chicken, egg, spinach, paneer) and any dietary restrictions (gluten-free, dairy-free). We&apos;ll discover the best matching recipes.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full">
                e.g. Chicken breast
              </span>
              <span className="bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full">
                Dairy free
              </span>
              <span className="bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full">
                High fiber
              </span>
            </div>
          </div>

          <Link
            href="/custom-category/ingredient-restriction"
            className="inline-flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-full shadow-md transition-all"
          >
            <span>Search by Ingredient</span>
            <FaArrowRight size={13} />
          </Link>
        </motion.div>

        {/* Option 2: By Calorie & Nutrient Target */}
        <motion.div
          whileHover={{ y: -4, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          className="bg-white rounded-3xl p-8 border-2 border-orange-100 shadow-sm flex flex-col justify-between space-y-6 hover:border-orange-300 transition-all"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <FaFireAlt size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 font-headline">
              By Calorie & Macro Target
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Set a precise calorie target (e.g. 500 kcal) and a target macro (protein, carbs, fat, fiber). Our ML candidate finder will select meals matching your exact metrics.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-3 py-1 rounded-full">
                500 kcal
              </span>
              <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-3 py-1 rounded-full">
                40g Protein
              </span>
              <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-3 py-1 rounded-full">
                Under 15g Fat
              </span>
            </div>
          </div>

          <Link
            href="/custom-category/calorie-nutrient"
            className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-full shadow-md transition-all"
          >
            <span>Search by Macros</span>
            <FaArrowRight size={13} />
          </Link>
        </motion.div>
      </div>

      {/* Quick Link to Saved Custom Recipes */}
      <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
            <FaBookmark size={16} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">View Saved Custom Recipes</h4>
            <p className="text-xs text-gray-500">Access all custom meals you previously bookmarked</p>
          </div>
        </div>
        <Link
          href="/custom-recipes"
          className="inline-flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs px-5 py-2.5 rounded-full border border-orange-200 transition"
        >
          <span>Saved Recipes</span>
          <FaArrowRight size={10} />
        </Link>
      </div>
    </div>
  );
}
