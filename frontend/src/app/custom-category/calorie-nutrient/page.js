"use client";

import React, { useState } from "react";
import api from "../../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaFireAlt, FaFire, FaClock, FaLeaf, FaBookmark, FaSlidersH } from "react-icons/fa";
import { toast } from "react-toastify";

const nutrientOptions = [
  { key: "protein", label: "Protein (g)", defaultVal: 35, min: 5, max: 100 },
  { key: "carbs", label: "Carbohydrates (g)", defaultVal: 50, min: 10, max: 150 },
  { key: "fat", label: "Fat (g)", defaultVal: 15, min: 2, max: 80 },
  { key: "fiber", label: "Fiber (g)", defaultVal: 8, min: 1, max: 40 },
];

export default function CalorieNutrientPage() {
  const [calories, setCalories] = useState(500);
  const [selectedNutrient, setSelectedNutrient] = useState("protein");
  const [nutrientValue, setNutrientValue] = useState(35);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleNutrientTypeChange = (key) => {
    setSelectedNutrient(key);
    const opt = nutrientOptions.find((o) => o.key === key);
    if (opt) setNutrientValue(opt.defaultVal);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!calories || calories <= 0) {
      toast.error("Please enter a valid calorie target");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/custom/calorie-nutrient", {
        calories: Number(calories),
        nutrient: {
          type: selectedNutrient,
          value: Number(nutrientValue),
        },
        save: true,
      });

      if (data?.meal) {
        setResult(data);
        toast.success("Found matching recipe!");
      } else {
        toast.info("No matching recipes found.");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "No recipes found matching these bounds."
      );
    } finally {
      setLoading(false);
    }
  };

  const currentOpt = nutrientOptions.find((o) => o.key === selectedNutrient) || nutrientOptions[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 text-gray-800">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
          Precision Macro Calibration
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
          Search by Calorie & Target Macro
        </h1>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Set your calorie ceiling and target macro to discover optimal recipe candidates:
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md space-y-6">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Calories input & slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Target Calories (kcal)
              </label>
              <span className="text-xl font-extrabold text-orange-500 font-headline">
                {calories} kcal
              </span>
            </div>
            <input
              type="range"
              min="150"
              max="1500"
              step="25"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full h-2 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[11px] font-semibold text-gray-400">
              <span>150 kcal (Light Snack)</span>
              <span>750 kcal (Main Meal)</span>
              <span>1500 kcal (Hearty Feast)</span>
            </div>
          </div>

          {/* Nutrient selector buttons */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Choose Priority Nutrient
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {nutrientOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => handleNutrientTypeChange(opt.key)}
                  className={`p-3 rounded-2xl text-xs font-bold transition border ${
                    selectedNutrient === opt.key
                      ? "bg-orange-500 text-white shadow-sm border-orange-500"
                      : "bg-gray-50 text-gray-700 hover:bg-orange-50 border-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nutrient Value Slider */}
          <div className="space-y-3 bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Target {currentOpt.label}
              </label>
              <span className="text-lg font-black text-orange-600">
                {nutrientValue}g
              </span>
            </div>
            <input
              type="range"
              min={currentOpt.min}
              max={currentOpt.max}
              value={nutrientValue}
              onChange={(e) => setNutrientValue(Number(e.target.value))}
              className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <FaSearch size={14} />
            )}
            <span>{loading ? "Discovering Recipes..." : "Find Calorie-Matched Recipe"}</span>
          </button>
        </form>
      </div>

      {/* Result Display */}
      {result && result.meal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-lg space-y-6"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase">
              Optimal Match Calibrated
            </span>
            <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
              <FaBookmark />
              <span>Saved to Custom Recipes</span>
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <img
              src={result.meal.mealImageURL || "/assets/ingredients.jpeg"}
              alt={result.meal.recipeName}
              className="w-full md:w-56 h-48 rounded-2xl object-cover border border-orange-100 shrink-0"
              onError={(e) => {
                e.target.src = "/assets/ingredients.jpeg";
              }}
            />
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 font-headline">
                  {result.meal.recipeName}
                </h3>
                {result.meal.recipeNameUrdu && (
                  <p className="text-sm font-semibold text-orange-500" dir="rtl">
                    {result.meal.recipeNameUrdu}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <FaFire size={11} />
                  {result.meal.calories} kcal
                </span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <FaClock size={11} />
                  {result.meal.preparationTime || 20} mins
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <FaLeaf size={11} />
                  {result.meal.dietaryType || "Balanced"}
                </span>
              </div>

              <div className="flex gap-4 pt-1 text-xs font-bold text-gray-600">
                <span>Protein: <strong className="text-emerald-600">{result.meal.nutrients?.protein || result.meal.protein || 0}g</strong></span>
                <span>Carbs: <strong className="text-amber-600">{result.meal.nutrients?.carbs || result.meal.carbs || 0}g</strong></span>
                <span>Fat: <strong className="text-purple-600">{result.meal.nutrients?.fat || result.meal.fat || 0}g</strong></span>
              </div>
            </div>
          </div>

          {/* Alternatives */}
          {result.alternatives && result.alternatives.length > 0 && (
            <div className="border-t border-orange-100 pt-6 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Alternative Recommendations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {result.alternatives.map((alt, idx) => (
                  <div key={idx} className="bg-orange-50/40 p-3.5 rounded-2xl border border-orange-50 flex items-center gap-3">
                    <img
                      src={alt.mealImageURL || "/assets/ingredients.jpeg"}
                      alt={alt.recipeName}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                      onError={(e) => {
                        e.target.src = "/assets/ingredients.jpeg";
                      }}
                    />
                    <div className="overflow-hidden">
                      <h5 className="font-bold text-xs text-gray-900 truncate">{alt.recipeName}</h5>
                      <p className="text-[10px] text-gray-500 font-medium">{alt.calories} kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
