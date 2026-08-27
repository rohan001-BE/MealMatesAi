"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import useWizardStore from "../../store/wizardStore";
import api, { regenerateMealPlan } from "../../lib/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSyncAlt,
  FaUtensils,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaArrowLeft,
  FaClock,
  FaLeaf,
  FaFire,
  FaBullseye,
  FaPrint,
  FaCalendarAlt,
  FaCheckCircle,
  FaHeart,
} from "react-icons/fa";

export default function MealPlanResult() {
  const { latestGeneratedPlan, setLatestGeneratedPlan, dailyCalories } = useWizardStore();
  const [mealPlan, setMealPlan] = useState(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [openSection, setOpenSection] = useState(null);
  const [savedMeals, setSavedMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (latestGeneratedPlan) {
      setMealPlan(latestGeneratedPlan);
    } else if (typeof window !== "undefined") {
      const savedPlan = sessionStorage.getItem("latest_generated_meal_plan");
      if (savedPlan) {
        try {
          setMealPlan(JSON.parse(savedPlan));
        } catch (e) {}
      }
    }
  }, [latestGeneratedPlan]);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const { data } = await regenerateMealPlan();
      if (data?.success && data?.mealPlan) {
        setMealPlan(data.mealPlan);
        setLatestGeneratedPlan(data.mealPlan);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("latest_generated_meal_plan", JSON.stringify(data.mealPlan));
        }
        setOpenSection(null);
        toast.success("Meal plan refreshed with new culinary variations!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to regenerate meal plan.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveMeal = (recipeId) => {
    setSavedMeals((prev) =>
      prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
    );
    toast.success("Recipe preferences synced to bookmarks.");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!mounted) return null;

  if (!mealPlan || !mealPlan.mealPlans || mealPlan.mealPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 px-4">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mx-auto shadow-sm">
          <FaUtensils size={36} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 font-headline">No Meal Plan Found</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Please complete the planner wizard to generate your customized nutrition schedule.
        </p>
        <Link
          href="/meal-planner"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-3.5 font-bold text-sm shadow-md transition-all"
        >
          <FaArrowLeft size={12} />
          <span>Go to Meal Planner</span>
        </Link>
      </div>
    );
  }

  const days = mealPlan.mealPlans || [];
  const currentDay = days[activeDayIdx] || days[0];
  const recipes = currentDay?.recipes || [];
  const targetCals = dailyCalories || mealPlan.dailyCalorieTarget || currentDay.totalCalories || 2000;

  const formatDietaryTitle = (dietaryType) => {
    if (!dietaryType) return "Desi";
    const rawList = Array.isArray(dietaryType) ? dietaryType : String(dietaryType).split(/[,+]/);
    const formatted = rawList
      .map((item) => {
        const clean = String(item).trim().replace(/_/g, " ");
        if (!clean) return "";
        return clean
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      })
      .filter(Boolean);
    return formatted.length > 0 ? formatted.join(" • ") : "Desi";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8 text-gray-800 animate-entrance">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100/90 shadow-xl shadow-orange-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-50/50 rounded-full blur-3xl -z-10" />

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold uppercase tracking-wider">
            <FaCheckCircle className="text-emerald-500" />
            <span>AI Multi-Objective Optimization Complete</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 font-headline">
            Your Personalized Meal Plan
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium flex items-center gap-4 flex-wrap">
            <span>
              Duration: <strong className="text-gray-900">{days.length} Days</strong>
            </span>
            <span>&bull;</span>
            <span>
              Target: <strong className="text-orange-500 font-bold">{targetCals} kcal / day</strong>
            </span>
            <span>&bull;</span>
            <span>
              Diet Mode: <strong className="text-gray-900 font-bold">{formatDietaryTitle(mealPlan.dietaryType)}</strong>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-full px-5 py-3 font-bold text-xs transition-all shadow-xs"
            title="Print or Save PDF"
          >
            <FaPrint size={13} />
            <span>Print Schedule</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full px-6 py-3 font-extrabold text-xs transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <FaSyncAlt size={13} />
            )}
            <span>{loading ? "Rotating Recipes..." : "Regenerate Plan"}</span>
          </button>
        </div>
      </div>

      {/* Days Tabs Horizontal Scroll */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-orange-200">
        {days.map((day, idx) => {
          const isActive = activeDayIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => {
                setActiveDayIdx(idx);
                setOpenSection(null);
              }}
              className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 shrink-0 flex items-center gap-2 ${
                isActive
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 transform -translate-y-0.5"
                  : "bg-white text-gray-600 hover:bg-orange-50/70 hover:text-orange-600 border border-orange-100 shadow-xs"
              }`}
            >
              <FaCalendarAlt size={12} className={isActive ? "text-white" : "text-orange-400"} />
              <span>Day {day.day || idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Day Macro Summary Bento Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-3xl border border-orange-100/80 shadow-sm text-center">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
            Calories
          </span>
          <p className="text-2xl sm:text-3xl font-black text-orange-500 mt-1 font-headline">
            {currentDay.totalCalories || targetCals}
            <span className="text-xs font-bold text-gray-400 ml-1">kcal</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-orange-100/80 shadow-sm text-center">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
            Protein Target
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 font-headline">
            {currentDay.totalProtein || Math.round((targetCals * 0.3) / 4)}
            <span className="text-xs font-bold text-gray-400 ml-1">g</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-orange-100/80 shadow-sm text-center">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
            Carbohydrates
          </span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 font-headline">
            {currentDay.totalCarbs || Math.round((targetCals * 0.45) / 4)}
            <span className="text-xs font-bold text-gray-400 ml-1">g</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-orange-100/80 shadow-sm text-center">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
            Healthy Fats
          </span>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1 font-headline">
            {currentDay.totalFat || Math.round((targetCals * 0.25) / 9)}
            <span className="text-xs font-bold text-gray-400 ml-1">g</span>
          </p>
        </div>
      </div>

      {/* Recipes List for Current Day */}
      <div className="space-y-6">
        {recipes.map((recipe, rIdx) => {
          const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack / Tea"];
          const mealLabel = recipe.assignedMealSlot || recipe.mealType || recipe.type || mealTypes[rIdx] || "Meal";
          const nutrients = recipe.nutrients || {};
          const imageSrc = recipe.mealImageURL || recipe.image || "/assets/ingredients.jpeg";
          const recipeId = recipe.id || `recipe-${rIdx}`;
          const isFavorited = savedMeals.includes(recipeId);

          const isNutrientsOpen = openSection === `nutrients-${rIdx}`;
          const isIngredientsOpen = openSection === `ingredients-${rIdx}`;
          const isInstructionsOpen = openSection === `instructions-${rIdx}`;

          return (
            <motion.div
              key={rIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rIdx * 0.08 }}
              className="bg-white rounded-3xl border border-orange-100/90 shadow-lg shadow-orange-500/5 p-6 sm:p-8 space-y-6 relative overflow-hidden"
            >
              {/* Recipe Header Info */}
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Food Image */}
                <div className="w-full md:w-56 h-48 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-orange-100 relative group bg-gray-50">
                  <img
                    src={imageSrc}
                    alt={recipe.recipeName || recipe.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = "/assets/ingredients.jpeg";
                    }}
                  />
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                    {mealLabel}
                  </span>
                  <button
                    onClick={() => toggleSaveMeal(recipeId)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition"
                    title="Bookmark recipe"
                  >
                    <FaHeart size={13} className={isFavorited ? "text-red-500" : ""} />
                  </button>
                </div>

                {/* Info and Macros */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 font-headline leading-tight">
                      {recipe.recipeName || recipe.name}
                    </h3>
                    {(recipe.recipeNameUrdu || recipe.urduName) && (
                      <p className="text-sm font-bold text-orange-600 mt-0.5" dir="rtl">
                        {recipe.recipeNameUrdu || recipe.urduName}
                      </p>
                    )}
                  </div>

                  {/* Metadata Badges */}
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-orange-100">
                      <FaFire size={11} />
                      <span>{recipe.calories} kcal</span>
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <FaClock size={11} />
                      <span>{recipe.preparationTime || recipe.prepTime || "20"} mins</span>
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-100">
                      <FaLeaf size={11} />
                      <span>{recipe.dietaryType || "Balanced"}</span>
                    </span>
                    <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-purple-100">
                      <FaBullseye size={11} />
                      <span>{recipe.weightGoal?.replace("_", " ") || "Custom Goal"}</span>
                    </span>
                  </div>

                  {/* Key Macro Splits */}
                  <div className="flex gap-4 pt-1 text-xs font-bold text-gray-600 flex-wrap">
                    <span>
                      Protein: <strong className="text-emerald-600 font-extrabold">{nutrients.protein || recipe.protein || 0}g</strong>
                    </span>
                    <span>
                      Carbs: <strong className="text-amber-600 font-extrabold">{nutrients.carbs || recipe.carbs || 0}g</strong>
                    </span>
                    <span>
                      Fats: <strong className="text-purple-600 font-extrabold">{nutrients.fat || recipe.fat || 0}g</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Accordion Panels */}
              <div className="space-y-3 pt-2">
                {/* 1. Nutrients Breakdown */}
                <div className="border border-orange-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(isNutrientsOpen ? null : `nutrients-${rIdx}`)}
                    className="w-full flex justify-between items-center px-5 py-3.5 bg-orange-50/40 hover:bg-orange-50 text-left text-xs sm:text-sm font-bold text-gray-800 transition"
                  >
                    <span className="flex items-center gap-2 text-orange-500">
                      <FaInfoCircle />
                      <span>Nutrients Breakdown</span>
                    </span>
                    {isNutrientsOpen ? <FaChevronUp size={12} className="text-orange-500" /> : <FaChevronDown size={12} className="text-orange-500" />}
                  </button>
                  <AnimatePresence>
                    {isNutrientsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-5 bg-white border-t border-orange-100"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                          <div className="bg-orange-50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Protein</p>
                            <p className="text-lg font-black text-orange-500">{nutrients.protein || recipe.protein || 0}g</p>
                          </div>
                          <div className="bg-amber-50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Carbs</p>
                            <p className="text-lg font-black text-amber-600">{nutrients.carbs || recipe.carbs || 0}g</p>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Fats</p>
                            <p className="text-lg font-black text-yellow-600">{nutrients.fat || recipe.fat || 0}g</p>
                          </div>
                          <div className="bg-emerald-50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Fiber</p>
                            <p className="text-lg font-black text-emerald-600">{nutrients.fiber || 5}g</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Sodium</p>
                            <p className="text-lg font-black text-blue-600">{nutrients.sodium || 280}mg</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Cholesterol</p>
                            <p className="text-lg font-black text-purple-600">{nutrients.cholesterol || 25}mg</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Ingredients List */}
                <div className="border border-orange-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(isIngredientsOpen ? null : `ingredients-${rIdx}`)}
                    className="w-full flex justify-between items-center px-5 py-3.5 bg-orange-50/40 hover:bg-orange-50 text-left text-xs sm:text-sm font-bold text-gray-800 transition"
                  >
                    <span className="flex items-center gap-2 text-orange-500">
                      <FaUtensils />
                      <span>Ingredients List (English & اردو)</span>
                    </span>
                    {isIngredientsOpen ? <FaChevronUp size={12} className="text-orange-500" /> : <FaChevronDown size={12} className="text-orange-500" />}
                  </button>
                  <AnimatePresence>
                    {isIngredientsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-5 bg-white border-t border-orange-100"
                      >
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                          {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? (
                            recipe.ingredients.map((ing, idx) => {
                              if (typeof ing === "object" && ing !== null) {
                                return (
                                  <li key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/30 border border-orange-50">
                                    <span className="font-semibold text-gray-800">{ing.englishName || ing.name}</span>
                                    <div className="flex items-center gap-2 text-xs">
                                      {ing.urduName && <span className="text-orange-600 font-medium" dir="rtl">({ing.urduName})</span>}
                                      <span className="font-bold text-gray-600">{ing.quantity}</span>
                                    </div>
                                  </li>
                                );
                              }
                              return (
                                <li key={idx} className="p-2.5 rounded-xl bg-orange-50/30 border border-orange-50 text-gray-800 font-medium">
                                  {ing}
                                </li>
                              );
                            })
                          ) : (
                            <li className="text-gray-500 italic">Fresh ingredients calibrated for Pakistani nutrition.</li>
                          )}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Cooking Instructions (Bilingual) */}
                <div className="border border-orange-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(isInstructionsOpen ? null : `instructions-${rIdx}`)}
                    className="w-full flex justify-between items-center px-5 py-3.5 bg-orange-50/40 hover:bg-orange-50 text-left text-xs sm:text-sm font-bold text-gray-800 transition"
                  >
                    <span className="flex items-center gap-2 text-orange-500">
                      <FaClock />
                      <span>Preparation & Cooking Steps</span>
                    </span>
                    {isInstructionsOpen ? <FaChevronUp size={12} className="text-orange-500" /> : <FaChevronDown size={12} className="text-orange-500" />}
                  </button>
                  <AnimatePresence>
                    {isInstructionsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-5 bg-white border-t border-orange-100 space-y-4"
                      >
                        {/* English Steps */}
                        <div className="space-y-2.5">
                          <h5 className="text-xs font-black text-orange-500 uppercase tracking-wider">English Instructions</h5>
                          <div className="space-y-2">
                            {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 ? (
                              recipe.instructions.map((step, idx) => {
                                const stepText = typeof step === "string" ? step.replace(/^Step \d+:\s*/i, "") : String(step);
                                return (
                                  <div key={idx} className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200/70 flex gap-3 items-start">
                                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                      {idx + 1}
                                    </span>
                                    <p className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                                      {stepText}
                                    </p>
                                  </div>
                                );
                              })
                            ) : recipe.instructions ? (
                              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800">
                                {recipe.instructions}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic">Cook fresh ingredients according to Pakistani traditional preparation.</p>
                            )}
                          </div>
                        </div>

                        {/* Urdu Steps */}
                        {(recipe.instructionsUrdu || recipe.instructions_ur) && (
                          <div className="space-y-2.5 pt-3 border-t border-orange-100" dir="rtl">
                            <h5 className="text-xs font-black text-orange-500 uppercase tracking-wider text-right">طریقہ کار (Urdu Instructions)</h5>
                            <div className="space-y-2">
                              {Array.isArray(recipe.instructionsUrdu || recipe.instructions_ur) ? (
                                (recipe.instructionsUrdu || recipe.instructions_ur).map((step, idx) => (
                                  <div key={idx} className="p-3 rounded-2xl bg-orange-50/30 border border-orange-100 flex gap-3 items-start text-right">
                                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                      {idx + 1}
                                    </span>
                                    <p className="text-xs sm:text-sm text-gray-900 font-bold leading-relaxed">
                                      {step}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 rounded-2xl bg-orange-50/30 border border-orange-100 text-xs sm:text-sm text-gray-900 font-bold leading-relaxed text-right">
                                  {recipe.instructionsUrdu || recipe.instructions_ur}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
