"use client";

import React, { useState } from "react";
import api from "../../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaCheck, FaArrowRight, FaLeaf, FaFire, FaClock, FaBookmark, FaSyncAlt } from "react-icons/fa";
import { toast } from "react-toastify";

const restrictionOptions = [
  "Gluten-Free",
  "Nut-Free",
  "Egg-Free",
  "Lactose-Free",
  "Low-Sodium",
  "Low-Carb",
  "Low-Sugar",
  "Low-Cholesterol",
  "Dairy-Free",
  "Low-Fat",
];

const popularIngredients = [
  "Chicken",
  "Egg",
  "Spinach",
  "Paneer",
  "Lentils",
  "Fish",
  "Mutton",
  "Beef",
  "Oats",
  "Chickpeas",
];

export default function IngredientRestrictionPage() {
  const [ingredient, setIngredient] = useState("");
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggleRestriction = (value) => {
    setSelectedRestrictions((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!ingredient.trim()) {
      toast.error("Please enter a target ingredient (e.g. Chicken, Egg)");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/custom/ingredient-restriction", {
        ingredient: ingredient.trim(),
        restrictions: selectedRestrictions,
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
        "No recipes found with these restrictions."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 text-gray-800">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
          Custom Ingredient Discovery
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
          Search by Ingredient & Restrictions
        </h1>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Specify what ingredient you want to cook and exclude any allergies or dietary restrictions:
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md space-y-6">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Ingredient input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Main Ingredient <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={ingredient}
                onChange={(e) => setIngredient(e.target.value)}
                placeholder="e.g. Chicken, Spinach, Egg, Paneer, Lentils"
                className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 px-5 py-3.5 text-sm font-medium pr-12"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                <FaSearch size={14} />
              </button>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1.5 items-center">
              <span className="text-[11px] font-semibold text-gray-400 mr-1">Popular:</span>
              {popularIngredients.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setIngredient(item)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    ingredient.toLowerCase() === item.toLowerCase()
                      ? "bg-orange-500 text-white border-orange-500 font-bold"
                      : "bg-orange-50/50 text-gray-600 border-orange-100 hover:bg-orange-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Restrictions multi-select */}
          <div className="space-y-2.5 pt-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Dietary Restrictions (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {restrictionOptions.map((res) => {
                const isSelected = selectedRestrictions.includes(res);
                return (
                  <button
                    type="button"
                    key={res}
                    onClick={() => toggleRestriction(res)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? "bg-orange-500 text-white shadow-sm border border-orange-500"
                        : "bg-gray-50 text-gray-700 hover:bg-orange-50 border border-gray-200"
                    }`}
                  >
                    {isSelected && <FaCheck size={10} />}
                    <span>{res}</span>
                  </button>
                );
              })}
            </div>
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
            <span>{loading ? "Searching..." : "Find Matching Recipes"}</span>
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
              Match Found ({result.count || 1} candidates)
            </span>
            <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
              <FaBookmark />
              <span>Auto-saved to Custom Recipes</span>
            </span>
          </div>

          {/* Main Recipe Card */}
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
