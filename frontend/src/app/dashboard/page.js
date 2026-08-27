"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "../../store/authStore";
import api, { regenerateMealPlan } from "../../lib/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheckCircle,
  FaRegCircle,
  FaFire,
  FaRobot,
  FaChartLine,
  FaBookmark,
  FaRegBookmark,
  FaUtensils,
  FaCalendarAlt,
  FaClock,
  FaLeaf,
  FaArrowRight,
  FaSyncAlt,
  FaEye,
  FaTimes,
  FaChevronRight,
  FaDumbbell,
  FaSeedling,
  FaTint,
  FaPlus,
  FaLightbulb,
  FaSearch,
  FaFilter,
  FaLayerGroup,
  FaStar,
  FaAppleAlt,
} from "react-icons/fa";

// In-memory cache for instantaneous 0ms transitions
let cachedCatalog = null;
let cachedDashboardData = null;
let cachedAllPlans = null;

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState(cachedDashboardData);
  const [latestPlan, setLatestPlan] = useState(cachedDashboardData?.latestPlan || null);
  const [allPlans, setAllPlans] = useState(cachedAllPlans || []);
  const [catalogRecipes, setCatalogRecipes] = useState(cachedCatalog || []);
  const [loading, setLoading] = useState(!cachedDashboardData);
  const [catalogLoading, setCatalogLoading] = useState(!cachedCatalog);
  const [completedMeals, setCompletedMeals] = useState(cachedDashboardData?.completedMeals || {});
  const [savedRecipes, setSavedRecipes] = useState(cachedDashboardData?.savedRecipes || []);
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "meals", "catalog", "plans", "saved"
  const [activePlanDayIdx, setActivePlanDayIdx] = useState(0);
  const [selectedRecipeModal, setSelectedRecipeModal] = useState(null);
  const [inspectingPlan, setInspectingPlan] = useState(null);
  const [inspectingPlanDayIdx, setInspectingPlanDayIdx] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  // Catalog tab filters
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogMealType, setCatalogMealType] = useState("all");
  const [catalogDietaryType, setCatalogDietaryType] = useState("all");
  const [catalogPage, setCatalogPage] = useState(1);
  const catalogPerPage = 16;

  // Dynamic Greeting based on Local Time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    let isCancelled = false;

    const fetchPrimaryData = async () => {
      // 1 & 2. Run Dashboard metrics & Plans history concurrently in parallel
      try {
        const [dashRes, plansRes] = await Promise.allSettled([
          api.get("/users/dashboard"),
          api.get("/mealplan/all"),
        ]);

        if (isCancelled) return;

        let foundLatestPlan = null;

        if (dashRes.status === "fulfilled" && dashRes.value?.data?.success) {
          const data = dashRes.value.data;
          cachedDashboardData = data;
          setDashboardData(data);
          if (data.latestPlan) {
            foundLatestPlan = data.latestPlan;
            setLatestPlan(data.latestPlan);
          }
          if (data.allPlans && data.allPlans.length > 0) {
            cachedAllPlans = data.allPlans;
            setAllPlans(data.allPlans);
          }
          if (data.completedMeals) setCompletedMeals(data.completedMeals);
          if (data.savedRecipes) setSavedRecipes(data.savedRecipes);
        }

        if (plansRes.status === "fulfilled") {
          const plans = plansRes.value?.data?.mealPlans || [];
          if (plans.length > 0) {
            const sorted = plans.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            cachedAllPlans = sorted;
            setAllPlans(sorted);
            if (!foundLatestPlan && sorted[0]) {
              setLatestPlan(sorted[0]);
            }
          }
        }
      } catch (err) {
        console.warn("Fast dashboard parallel load warning:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
          setMounted(true);
        }
      }

      // 3. Defer 650+ Recipes Catalog fetching in the background (Non-blocking)
      if (!cachedCatalog) {
        try {
          const { data: recipesData } = await api.get("/recipes/all");
          if (!isCancelled && recipesData?.recipes) {
            cachedCatalog = recipesData.recipes;
            setCatalogRecipes(recipesData.recipes);
          }
        } catch (e) {
          console.warn("Recipe catalog background load fallback:", e);
        } finally {
          if (!isCancelled) setCatalogLoading(false);
        }
      } else {
        if (!isCancelled) setCatalogLoading(false);
      }
    };

    fetchPrimaryData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (selectedRecipeModal || inspectingPlan) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedRecipeModal, inspectingPlan]);

  const toggleMealCompletion = async (mealKey) => {
    const isCompleted = !completedMeals[mealKey];
    const updated = {
      ...completedMeals,
      [mealKey]: isCompleted,
    };
    setCompletedMeals(updated);

    try {
      await api.post("/users/dashboard/meal-toggle", {
        mealIndex: Number(mealKey.split("-")[1] || mealKey),
        completed: isCompleted,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard_completed_meals", JSON.stringify(updated));
      }
      toast.success(isCompleted ? "Meal marked as completed! 🎯" : "Meal unchecked");
    } catch (err) {
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard_completed_meals", JSON.stringify(updated));
      }
    }
  };

  const handleSaveRecipe = async (meal) => {
    const mealName = meal.recipeName || meal.name;
    try {
      const isAlreadySaved = savedRecipes.some((r) => (r.recipeName || r.name) === mealName);
      if (isAlreadySaved) {
        await api.delete(`/users/saved-recipes/${encodeURIComponent(mealName)}`);
        setSavedRecipes((prev) => prev.filter((r) => (r.recipeName || r.name) !== mealName));
        toast.info("Recipe removed from bookmarks.");
      } else {
        const payload = {
          recipeName: mealName,
          recipeNameUrdu: meal.recipeNameUrdu || meal.urduName || "",
          calories: meal.calories || 0,
          protein: meal.protein || 0,
          carbs: meal.carbs || 0,
          fat: meal.fat || meal.fats || 0,
          image: meal.mealImageURL || meal.meal_image_url || meal.image || "/assets/ingredients.jpeg",
          prepTime: meal.preparationTime || meal.prepTime || "20 mins",
          dietaryType: meal.dietaryType || "Desi",
          ingredients: meal.ingredients || [],
          instructions: meal.instructions || [],
          instructionsUrdu: meal.instructionsUrdu || meal.instructions_ur || "",
        };
        await api.post("/users/save-recipe", payload);
        setSavedRecipes((prev) => [...prev, payload]);
        toast.success(`"${mealName}" saved to your personal collection!`);
      }
    } catch (err) {
      toast.error("Failed to bookmark recipe.");
    }
  };

  const handleRegenerateToday = async () => {
    setIsRotating(true);
    try {
      const { data } = await regenerateMealPlan();
      if (data?.success && data?.mealPlan) {
        setLatestPlan(data.mealPlan);
        setActivePlanDayIdx(0);
        toast.success("Meal plan refreshed with new Pakistani recipes!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to regenerate meals.");
    } finally {
      setIsRotating(false);
    }
  };

  // Format Dietary Names & Goals properly (Title Case, no underscores, clean separators)
  const formatDietaryTitle = (dietaryType) => {
    if (!dietaryType) return "Desi Nutritional Plan";
    const rawList = Array.isArray(dietaryType)
      ? dietaryType
      : String(dietaryType).split(/[,+]/);

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

    if (formatted.length === 0) return "Nutritional Plan";
    if (formatted.length === 1) return `${formatted[0]} Nutritional Plan`;
    return `${formatted.join(" • ")} Plan`;
  };

  const formatGoal = (goal) => {
    if (!goal) return "Weight Management";
    const clean = String(goal).replace(/_/g, " ");
    return clean
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  // Base Targets Calibration
  const targetCalories = dashboardData?.targets?.dailyCalories || user?.dailyCalories || 2200;
  const targetProtein = dashboardData?.targets?.targetProtein || Math.round((targetCalories * 0.3) / 4);
  const targetCarbs = dashboardData?.targets?.targetCarbs || Math.round((targetCalories * 0.45) / 4);
  const targetFat = dashboardData?.targets?.targetFat || Math.round((targetCalories * 0.25) / 9);

  // Multi-day Meal Plan handling
  const planDays = latestPlan?.mealPlans || latestPlan?.days || [];
  const currentDay = planDays[activePlanDayIdx] || planDays[0] || null;
  const activeMealsList = currentDay?.recipes || currentDay?.meals || [];

  // Consumed calculations for active day
  const dayCalories = currentDay?.totalCalories || activeMealsList.reduce((acc, m) => acc + (m.calories || 0), 0);
  const dayProtein = currentDay?.totalProtein || activeMealsList.reduce((acc, m) => acc + (m.protein || 0), 0);
  const dayCarbs = currentDay?.totalCarbs || activeMealsList.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const dayFat = currentDay?.totalFat || activeMealsList.reduce((acc, m) => acc + (m.fat || m.fats || 0), 0);

  // SVG Progress Ring metrics
  const mainCirc = 615.7; // r=98
  const calPercent = Math.min(100, targetCalories > 0 ? (dayCalories / targetCalories) * 100 : 0);
  const calOffset = mainCirc - (mainCirc * calPercent) / 100;

  const macroCirc = 150.8; // r=24
  const protPercent = Math.min(100, targetProtein > 0 ? (dayProtein / targetProtein) * 100 : 0);
  const protOffset = macroCirc - (macroCirc * protPercent) / 100;

  const carbPercent = Math.min(100, targetCarbs > 0 ? (dayCarbs / targetCarbs) * 100 : 0);
  const carbOffset = macroCirc - (macroCirc * carbPercent) / 100;

  const fatPercent = Math.min(100, targetFat > 0 ? (dayFat / targetFat) * 100 : 0);
  const fatOffset = macroCirc - (macroCirc * fatPercent) / 100;

  const totalMealsCount = activeMealsList.length;
  const completedCount = activeMealsList.filter(
    (m, idx) => completedMeals[`${activePlanDayIdx}-${idx}`] || completedMeals[idx]
  ).length;

  // Filtered Catalog Recipes
  const filteredCatalog = useMemo(() => {
    return catalogRecipes.filter((r) => {
      const q = catalogSearch.toLowerCase().trim();
      const nameMatch = (r.recipeName || "").toLowerCase().includes(q) || (r.urduName || "").includes(q);
      const ingredientMatch = Array.isArray(r.ingredients)
        ? r.ingredients.some((ing) => {
            const ingText = typeof ing === "object" ? `${ing.englishName || ""} ${ing.urduName || ""}` : String(ing);
            return ingText.toLowerCase().includes(q);
          })
        : false;

      const matchesQuery = !q || nameMatch || ingredientMatch;
      const matchesMeal =
        catalogMealType === "all" ||
        (r.mealType || "").toLowerCase() === catalogMealType.toLowerCase();
      const matchesDiet =
        catalogDietaryType === "all" ||
        (r.dietaryType || "").toLowerCase() === catalogDietaryType.toLowerCase();

      return matchesQuery && matchesMeal && matchesDiet;
    });
  }, [catalogRecipes, catalogSearch, catalogMealType, catalogDietaryType]);

  const catalogTotalPages = Math.ceil(filteredCatalog.length / catalogPerPage) || 1;
  const paginatedCatalog = useMemo(() => {
    const start = (catalogPage - 1) * catalogPerPage;
    return filteredCatalog.slice(start, start + catalogPerPage);
  }, [filteredCatalog, catalogPage]);

  // Inspecting Saved Plan Calculations
  const inspectingDays = inspectingPlan?.mealPlans || inspectingPlan?.days || [];
  const activeInspectingDay = inspectingDays[inspectingPlanDayIdx] || inspectingDays[0] || null;
  const inspectingMeals = activeInspectingDay?.recipes || activeInspectingDay?.meals || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-gray-800 select-none">
      {/* 1. Top Header Banner with Greeting & Floating AI Trigger */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-3xl p-6 sm:p-8 border border-orange-100/90 shadow-xl shadow-orange-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-50/50 rounded-full blur-3xl -z-10" />

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-black uppercase tracking-wider shadow-2xs">
              <span>🔥 Streak:</span>
              <span>{dashboardData?.user?.streakDays || 5} Days Active</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-black uppercase tracking-wider shadow-2xs">
              <FaAppleAlt className="text-amber-500 text-[10px]" />
              <span>{(user?.dietaryType || "Desi Nutrition").replace("_", " ")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-black uppercase tracking-wider shadow-2xs">
              <FaLeaf className="text-emerald-500 text-[10px]" />
              <span>{catalogRecipes.length || 727}+ Recipes</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 font-headline tracking-tight">
            {getGreeting()}, {user?.username || dashboardData?.user?.username || "Friend"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            Let&apos;s make today nutritious. Your metabolic target is calibrated for{" "}
            <strong className="text-orange-500 font-bold capitalize">
              {(user?.weightGoal || dashboardData?.user?.weightGoal || "weight_loss").replace("_", " ")}
            </strong>.
          </p>
        </div>

        {/* Action Controls & Floating AI Orb */}
        <div className="flex items-center gap-4 flex-wrap w-full md:w-auto">
          <Link
            href="/chatbot"
            className="w-full sm:w-auto justify-center flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-3.5 rounded-full font-extrabold text-xs sm:text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 group"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <FaRobot size={13} />
            </div>
            <span>Ask AI Nutritionist</span>
            <FaArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </header>

      {/* 2. Navigation Tabs Bar */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 border-b border-orange-100">
        {[
          { id: "overview", label: "Dashboard Overview", icon: <FaChartLine /> },
          { id: "meals", label: "Multi-Day Schedule", icon: <FaUtensils />, count: planDays.length > 0 ? `${planDays.length} Days` : undefined },
          { id: "plans", label: "Saved Meal Plans", icon: <FaLayerGroup />, count: allPlans.length },
          { id: "catalog", label: "All 650+ Recipes", icon: <FaLeaf />, count: catalogRecipes.length || 650 },
          { id: "saved", label: "Saved Bookmarks", icon: <FaBookmark />, count: savedRecipes.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 shrink-0 flex items-center gap-2.5 ${
                isActive
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 transform -translate-y-0.5"
                  : "bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-orange-100 shadow-xs"
              }`}
            >
              <span className={isActive ? "text-white" : "text-orange-500"}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: OVERVIEW BENTO GRID */}
      {activeTab === "overview" && (
        <div className="space-y-10">
          {/* Day Selector Pills if Multi-Day Plan exists */}
          {planDays.length > 1 && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-orange-100 shadow-sm flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-orange-500" />
                <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                  Active {planDays.length}-Day Plan:
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {planDays.map((d, dIdx) => (
                  <button
                    key={dIdx}
                    onClick={() => setActivePlanDayIdx(dIdx)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      activePlanDayIdx === dIdx
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                        : "bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-200"
                    }`}
                  >
                    Day {d.day || dIdx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-3" />
              <p className="text-sm font-semibold text-gray-500">Loading your live dashboard metrics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Central Card: Today's Nutrition Rings (Spans 8 cols) */}
              <section className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-500/5 border border-orange-100/90 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-bl-full -z-10 blur-3xl" />

                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">
                      Day {currentDay?.day || activePlanDayIdx + 1} Energetics
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 font-headline tracking-tight">
                      Nutrition & Macro Rings
                    </h3>
                  </div>

                  <button
                    onClick={handleRegenerateToday}
                    disabled={isRotating}
                    className="inline-flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-full px-4 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50"
                    title="Rotate recipes with new options"
                  >
                    <FaSyncAlt size={11} className={isRotating ? "animate-spin" : ""} />
                    <span>{isRotating ? "Refreshing..." : "Rotate Dishes"}</span>
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 justify-around my-2">
                  {/* Main Calorie Ring */}
                  <div className="relative w-56 h-56 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
                      <circle
                        className="text-orange-50"
                        cx="110"
                        cy="110"
                        fill="transparent"
                        r="98"
                        stroke="currentColor"
                        strokeWidth="14"
                      />
                      <motion.circle
                        className="text-orange-500"
                        cx="110"
                        cy="110"
                        fill="transparent"
                        r="98"
                        stroke="currentColor"
                        strokeWidth="14"
                        strokeDasharray={mainCirc}
                        initial={{ strokeDashoffset: mainCirc }}
                        animate={{ strokeDashoffset: calOffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center flex flex-col items-center">
                      <span className="text-3xl sm:text-4xl font-black text-gray-900 font-headline leading-none">
                        {dayCalories}
                      </span>
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        / {targetCalories} KCAL
                      </span>
                      <span className="text-[10px] bg-orange-100 text-orange-700 font-extrabold px-2.5 py-0.5 rounded-full mt-2">
                        {Math.round(calPercent)}% Target
                      </span>
                    </div>
                  </div>

                  {/* Sub-Macro Progress Rings */}
                  <div className="flex flex-col gap-4 w-full md:w-auto">
                    {/* Protein */}
                    <div className="flex items-center justify-between gap-6 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/80">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                            <circle className="text-emerald-100" cx="30" cy="30" fill="transparent" r="24" stroke="currentColor" strokeWidth="4.5" />
                            <motion.circle
                              className="text-emerald-500"
                              cx="30"
                              cy="30"
                              fill="transparent"
                              r="24"
                              stroke="currentColor"
                              strokeWidth="4.5"
                              strokeDasharray={macroCirc}
                              initial={{ strokeDashoffset: macroCirc }}
                              animate={{ strokeDashoffset: protOffset }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              strokeLinecap="round"
                            />
                          </svg>
                          <FaDumbbell className="absolute text-emerald-600 text-xs" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">PROTEIN</p>
                          <p className="text-sm font-black text-gray-900 font-headline">{dayProtein}g / {targetProtein}g</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-700">{Math.round(protPercent)}%</span>
                    </div>

                    {/* Carbs */}
                    <div className="flex items-center justify-between gap-6 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/80">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                            <circle className="text-amber-100" cx="30" cy="30" fill="transparent" r="24" stroke="currentColor" strokeWidth="4.5" />
                            <motion.circle
                              className="text-amber-500"
                              cx="30"
                              cy="30"
                              fill="transparent"
                              r="24"
                              stroke="currentColor"
                              strokeWidth="4.5"
                              strokeDasharray={macroCirc}
                              initial={{ strokeDashoffset: macroCirc }}
                              animate={{ strokeDashoffset: carbOffset }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              strokeLinecap="round"
                            />
                          </svg>
                          <FaSeedling className="absolute text-amber-600 text-xs" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">CARBOHYDRATES</p>
                          <p className="text-sm font-black text-gray-900 font-headline">{dayCarbs}g / {targetCarbs}g</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-700">{Math.round(carbPercent)}%</span>
                    </div>

                    {/* Fats */}
                    <div className="flex items-center justify-between gap-6 bg-purple-50/50 p-4 rounded-2xl border border-purple-100/80">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                            <circle className="text-purple-100" cx="30" cy="30" fill="transparent" r="24" stroke="currentColor" strokeWidth="4.5" />
                            <motion.circle
                              className="text-purple-500"
                              cx="30"
                              cy="30"
                              fill="transparent"
                              r="24"
                              stroke="currentColor"
                              strokeWidth="4.5"
                              strokeDasharray={macroCirc}
                              initial={{ strokeDashoffset: macroCirc }}
                              animate={{ strokeDashoffset: fatOffset }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              strokeLinecap="round"
                            />
                          </svg>
                          <FaTint className="absolute text-purple-600 text-xs" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">HEALTHY FATS</p>
                          <p className="text-sm font-black text-gray-900 font-headline">{dayFat}g / {targetFat}g</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-purple-700">{Math.round(fatPercent)}%</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* AI Insight Card (Spans 4 cols) */}
              <section className="lg:col-span-4 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-500/20 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full w-fit text-[10px] font-black tracking-widest uppercase">
                    <FaLightbulb />
                    <span>AI Daily Insight</span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black font-headline leading-tight">
                    Metabolic Guidance
                  </h4>
                  <p className="text-xs sm:text-sm text-orange-100 font-medium leading-relaxed">
                    You are tracking closely with your daily macro allocation. Pair your meals with wholesome whole grains and green tea to stabilize energy and aid digestion.
                  </p>
                </div>

                <div className="pt-6 relative z-10">
                  <Link
                    href="/chatbot"
                    className="w-full bg-white hover:bg-orange-50 text-orange-600 font-extrabold text-xs sm:text-sm py-3.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95"
                  >
                    <FaRobot size={14} />
                    <span>Ask AI Nutritionist</span>
                    <FaChevronRight size={11} />
                  </Link>
                </div>
              </section>
            </div>
          )}

          {/* Today's Meals Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">
                  Day {currentDay?.day || activePlanDayIdx + 1} Dishes
                </span>
                <h3 className="text-2xl font-black text-gray-900 font-headline tracking-tight">
                  Scheduled Meals
                </h3>
              </div>
              <button
                onClick={() => setActiveTab("meals")}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5"
              >
                <span>View Multi-Day Schedule</span>
                <FaArrowRight size={10} />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white rounded-3xl p-5 border border-orange-100 animate-pulse h-72" />
                ))}
              </div>
            ) : activeMealsList.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-orange-100 shadow-sm space-y-4">
                <FaUtensils size={36} className="text-orange-400 mx-auto" />
                <h4 className="text-lg font-black text-gray-900">No Scheduled Meals for this Day</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Generate your custom AI meal plan to populate your daily schedule.
                </p>
                <Link
                  href="/meal-planner"
                  className="inline-flex items-center gap-2 bg-orange-500 text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-md"
                >
                  Generate Plan Now
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {activeMealsList.map((meal, idx) => {
                  const mealKey = `${activePlanDayIdx}-${idx}`;
                  const isCompleted = completedMeals[mealKey] || completedMeals[idx] || false;
                  const labels = ["Breakfast", "Lunch", "Snack / Tea", "Dinner"];
                  const mealLabel = meal.assignedMealSlot || meal.mealType || labels[idx] || "Meal Slot";
                  const isSaved = savedRecipes.some((r) => (r.recipeName || r.name) === (meal.recipeName || meal.name));
                  const mealImage = meal.mealImageURL || meal.meal_image_url || meal.image || "/assets/ingredients.jpeg";

                  return (
                    <div
                      key={idx}
                      className={`bg-white rounded-3xl p-5 border shadow-lg shadow-orange-500/5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:scale-102 hover:shadow-xl ${
                        isCompleted ? "border-orange-500 bg-orange-50/20" : "border-orange-100/90"
                      }`}
                    >
                      {/* Meal Image Container */}
                      <div className="w-full h-40 rounded-2xl overflow-hidden bg-gray-100 relative group">
                        <img
                          src={mealImage}
                          alt={meal.recipeName || meal.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = "/assets/ingredients.jpeg";
                          }}
                        />
                        <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm">
                          {mealLabel}
                        </span>
                        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                          {meal.calories} KCAL
                        </span>
                      </div>

                      {/* Meal Content */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-gray-900 text-sm line-clamp-1 font-headline">
                            {meal.recipeName || meal.name}
                          </h4>
                          <button
                            onClick={() => handleSaveRecipe(meal)}
                            className="text-gray-400 hover:text-orange-500 transition p-0.5"
                            title="Save to recipes"
                          >
                            {isSaved ? <FaBookmark size={13} className="text-orange-500" /> : <FaRegBookmark size={13} />}
                          </button>
                        </div>

                        {(meal.recipeNameUrdu || meal.urduName) && (
                          <p className="text-xs font-bold text-orange-600 truncate" dir="rtl">
                            {meal.recipeNameUrdu || meal.urduName}
                          </p>
                        )}

                        <div className="flex gap-3 text-[11px] font-bold text-gray-500 pt-1">
                          <span>P: <strong className="text-emerald-600">{meal.protein}g</strong></span>
                          <span>C: <strong className="text-amber-600">{meal.carbs}g</strong></span>
                          <span>F: <strong className="text-purple-600">{meal.fat || meal.fats || 0}g</strong></span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-orange-100/70 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedRecipeModal(meal)}
                          className="text-orange-600 hover:text-orange-700 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <FaEye size={12} />
                          <span>View Recipe</span>
                        </button>

                        <button
                          onClick={() => toggleMealCompletion(mealKey)}
                          className={`text-xs font-extrabold flex items-center gap-1.5 px-3 py-1 rounded-full transition ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700"
                          }`}
                        >
                          {isCompleted ? <FaCheckCircle className="text-emerald-600" /> : <FaRegCircle />}
                          <span>{isCompleted ? "Done" : "Mark Done"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* 4. TAB 2: MULTI-DAY SCHEDULE WITH FULL DETAILS */}
      {activeTab === "meals" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900 font-headline">Multi-Day Meal Schedule</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Completed {completedCount} of {totalMealsCount} meals for Day {currentDay?.day || activePlanDayIdx + 1}.
              </p>
            </div>

            {/* Day Selector with Macro Summary */}
            {planDays.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {planDays.map((d, dIdx) => {
                  const dCals = d.totalCalories || (d.recipes || d.meals || []).reduce((a, m) => a + (m.calories || 0), 0);
                  return (
                    <button
                      key={dIdx}
                      onClick={() => setActivePlanDayIdx(dIdx)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                        activePlanDayIdx === dIdx
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                          : "bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-orange-100"
                      }`}
                    >
                      <span>Day {d.day || dIdx + 1}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activePlanDayIdx === dIdx ? "bg-white/20 text-white" : "bg-orange-50 text-orange-600"
                      }`}>
                        {dCals} kcal
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeMealsList.map((meal, idx) => {
              const mealKey = `${activePlanDayIdx}-${idx}`;
              const isCompleted = completedMeals[mealKey] || completedMeals[idx] || false;
              const labels = ["Breakfast", "Lunch", "Snack / Tea", "Dinner"];
              const mealLabel = meal.assignedMealSlot || meal.mealType || labels[idx] || "Meal Slot";
              const mealImage = meal.mealImageURL || meal.meal_image_url || meal.image || "/assets/ingredients.jpeg";

              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-orange-100/90 shadow-lg shadow-orange-500/5 space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={mealImage}
                      alt={meal.recipeName || meal.name}
                      className="w-24 h-24 rounded-2xl object-cover border border-orange-100 shrink-0"
                      onError={(e) => {
                        e.target.src = "/assets/ingredients.jpeg";
                      }}
                    />
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                        {mealLabel}
                      </span>
                      <h4 className="text-lg font-black text-gray-900 font-headline leading-tight">
                        {meal.recipeName || meal.name}
                      </h4>
                      {(meal.recipeNameUrdu || meal.urduName) && (
                        <p className="text-xs font-bold text-orange-600" dir="rtl">
                          {meal.recipeNameUrdu || meal.urduName}
                        </p>
                      )}
                      <div className="flex gap-3 text-xs font-extrabold text-gray-600 pt-1">
                        <span className="text-orange-500 font-black">{meal.calories} kcal</span>
                        <span>P: {meal.protein}g</span>
                        <span>C: {meal.carbs}g</span>
                        <span>F: {meal.fat || meal.fats || 0}g</span>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients Preview */}
                  {Array.isArray(meal.ingredients) && meal.ingredients.length > 0 && (
                    <div className="bg-orange-50/30 p-3.5 rounded-2xl border border-orange-100/60 space-y-1.5">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                        Ingredients Included
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {meal.ingredients.map((ing, iIdx) => (
                          <span
                            key={iIdx}
                            className="bg-white border border-orange-100 text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                          >
                            {typeof ing === "object" ? `${ing.englishName || ing.name} (${ing.quantity || ""})` : ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setSelectedRecipeModal(meal)}
                      className="text-xs font-extrabold text-orange-600 hover:text-orange-700 flex items-center gap-1.5"
                    >
                      <FaEye size={12} />
                      <span>Cooking Method & Full Recipe</span>
                    </button>

                    <button
                      onClick={() => toggleMealCompletion(mealKey)}
                      className={`text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-2 ${
                        isCompleted
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                      }`}
                    >
                      {isCompleted ? <FaCheckCircle /> : <FaRegCircle />}
                      <span>{isCompleted ? "Completed ✓" : "Mark as Done"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB 3: SAVED MEAL PLANS HISTORY (SUPER POWERFUL INSPECTOR) */}
      {activeTab === "plans" && (
        <div className="space-y-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900 font-headline">Saved Multi-Day Meal Plans</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Access, inspect, and activate any of your AI-optimized Pakistani meal plans.
              </p>
            </div>
            <Link
              href="/meal-planner"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-full shadow-md transition"
            >
              + Generate New Plan
            </Link>
          </div>

          {allPlans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-orange-100 space-y-4">
              <FaCalendarAlt size={36} className="text-orange-400 mx-auto" />
              <h4 className="text-lg font-bold text-gray-900">No Saved Meal Plans Yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Generate your first personalized meal plan with our multi-objective AI optimizer.
              </p>
              <Link
                href="/meal-planner"
                className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold text-xs px-6 py-3 rounded-full shadow-md"
              >
                Go to Meal Planner
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {allPlans.map((plan, pIdx) => {
                const daysList = plan.mealPlans || plan.days || [];
                const daysCount = plan.daysCount || daysList.length || 1;
                const planKey = plan.id || plan._id || plan.createdAt;
                const activeKey = latestPlan?.id || latestPlan?._id || latestPlan?.createdAt;
                const isActivePlan = Boolean(planKey && activeKey && planKey === activeKey);
                const targetCal = plan.targetCalories || plan.dailyCalorieTarget || 2000;

                // Sample dish images from this plan
                const previewImages = [];
                daysList.forEach((d) => {
                  (d.recipes || d.meals || []).forEach((m) => {
                    const img = m.mealImageURL || m.meal_image_url || m.image;
                    if (img && !previewImages.includes(img) && previewImages.length < 4) {
                      previewImages.push(img);
                    }
                  });
                });

                return (
                  <div
                    key={pIdx}
                    className={`bg-white rounded-3xl p-6 border shadow-lg shadow-orange-500/5 space-y-5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 ${
                      isActivePlan ? "border-orange-500 bg-orange-50/15 ring-2 ring-orange-500/20" : "border-orange-100"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Header Row */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-3 py-1 rounded-full uppercase">
                            📅 {daysCount} Days Schedule
                          </span>
                          {isActivePlan && (
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                              <FaCheckCircle className="text-emerald-600" /> Active Schedule
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 font-semibold">
                          {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "Saved"}
                        </span>
                      </div>

                      {/* Title and Macros */}
                      <div>
                        <h4 className="text-xl font-black text-gray-900 font-headline">
                          {formatDietaryTitle(plan.dietaryType)}
                        </h4>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-600 mt-1">
                          <span>Target: <strong className="text-orange-600">{targetCal} kcal/day</strong></span>
                          <span>&bull;</span>
                          <span>{formatGoal(plan.weightGoal)}</span>
                        </div>
                      </div>

                      {/* Dish Thumbnails Preview */}
                      {previewImages.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                            Included Dishes Preview
                          </span>
                          <div className="flex gap-2">
                            {previewImages.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt="Dish preview"
                                className="w-14 h-14 rounded-xl object-cover border border-orange-100 shadow-xs"
                                onError={(e) => {
                                  e.target.src = "/assets/ingredients.jpeg";
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="pt-4 border-t border-orange-100 flex items-center justify-between gap-3 flex-wrap">
                      <button
                        onClick={() => {
                          setInspectingPlan(plan);
                          setInspectingPlanDayIdx(0);
                        }}
                        className="text-xs font-extrabold text-orange-600 hover:text-orange-700 flex items-center gap-1.5"
                      >
                        <FaEye size={12} />
                        <span>Inspect All {daysCount} Days Details</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {!isActivePlan && (
                          <button
                            onClick={() => {
                              setLatestPlan(plan);
                              setActivePlanDayIdx(0);
                              setActiveTab("meals");
                              toast.success("Activated meal plan on dashboard!");
                            }}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs px-3.5 py-1.5 rounded-full transition"
                          >
                            Set as Active
                          </button>
                        )}
                        <Link
                          href="/meal-plan-result"
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-xs transition"
                        >
                          Full Result &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: ALL 650+ RECIPES CATALOG */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search Biryani, Karahi, Daal, Paneer, Chana..."
                  value={catalogSearch}
                  onChange={(e) => {
                    setCatalogSearch(e.target.value);
                    setCatalogPage(1);
                  }}
                  className="w-full h-11 pl-11 pr-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
                {catalogSearch && (
                  <button
                    onClick={() => setCatalogSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>

              <span className="text-xs font-bold text-gray-500 self-end md:self-auto">
                Showing <strong className="text-orange-600">{filteredCatalog.length}</strong> of {catalogRecipes.length || 650}+ dishes
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-orange-50">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mr-2">
                <FaFilter size={10} /> Slot:
              </span>
              {[
                { label: "All Slots", val: "all" },
                { label: "Breakfast", val: "breakfast" },
                { label: "Lunch", val: "lunch" },
                { label: "Dinner", val: "dinner" },
                { label: "Snack / Tea", val: "snack" },
              ].map((m) => (
                <button
                  key={m.val}
                  onClick={() => {
                    setCatalogMealType(m.val);
                    setCatalogPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    catalogMealType === m.val
                      ? "bg-orange-500 text-white shadow-xs"
                      : "bg-gray-100 hover:bg-orange-50 text-gray-600 hover:text-orange-600"
                  }`}
                >
                  {m.label}
                </button>
              ))}

              <div className="h-4 w-px bg-gray-200 mx-2 self-center hidden sm:block" />

              <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mr-2">
                Diet:
              </span>
              {[
                { label: "All Diets", val: "all" },
                { label: "Desi", val: "desi" },
                { label: "High Protein", val: "high_protein" },
                { label: "Keto", val: "keto" },
                { label: "Vegetarian", val: "vegetarian" },
                { label: "Vegan", val: "vegan" },
              ].map((d) => (
                <button
                  key={d.val}
                  onClick={() => {
                    setCatalogDietaryType(d.val);
                    setCatalogPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    catalogDietaryType === d.val
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-gray-100 hover:bg-amber-50 text-gray-600 hover:text-amber-600"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {catalogLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-5 border border-orange-100 shadow-md space-y-4 animate-pulse">
                  <div className="h-40 bg-gray-100 rounded-2xl w-full" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : paginatedCatalog.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-orange-100 space-y-2">
              <FaUtensils size={32} className="text-orange-300 mx-auto" />
              <h4 className="text-base font-bold text-gray-800">No matching recipes found</h4>
              <p className="text-xs text-gray-500">Try changing your search term or dietary filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedCatalog.map((r, idx) => {
              const isSaved = savedRecipes.some((s) => (s.recipeName || s.name) === (r.recipeName || r.name));
              const rImage = r.mealImageURL || r.meal_image_url || r.image || "/assets/ingredients.jpeg";

              return (
                <div
                  key={r.id || idx}
                  className="bg-white rounded-3xl p-5 border border-orange-100/90 shadow-lg shadow-orange-500/5 flex flex-col justify-between space-y-4 hover:shadow-xl transition duration-300 hover:scale-102"
                >
                  <div className="w-full h-40 rounded-2xl overflow-hidden bg-gray-100 relative group">
                    <img
                      src={rImage}
                      alt={r.recipeName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = "/assets/ingredients.jpeg";
                      }}
                    />
                    <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm">
                      {r.mealType || "Recipe"}
                    </span>
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                      {r.calories} kcal
                    </span>
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-gray-900 text-sm line-clamp-1 font-headline">
                        {r.recipeName}
                      </h4>
                      <button
                        onClick={() => handleSaveRecipe(r)}
                        className="text-gray-400 hover:text-orange-500 transition p-0.5"
                        title="Bookmark recipe"
                      >
                        {isSaved ? <FaBookmark size={13} className="text-orange-500" /> : <FaRegBookmark size={13} />}
                      </button>
                    </div>

                    {r.urduName && (
                      <p className="text-xs font-bold text-orange-600 truncate" dir="rtl">
                        {r.urduName}
                      </p>
                    )}

                    <div className="flex gap-3 text-[11px] font-bold text-gray-600 pt-1">
                      <span>P: <strong className="text-emerald-600">{r.protein}g</strong></span>
                      <span>C: <strong className="text-amber-600">{r.carbs}g</strong></span>
                      <span>F: <strong className="text-purple-600">{r.fat}g</strong></span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-orange-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedRecipeModal(r)}
                      className="text-orange-600 hover:text-orange-700 text-xs font-bold flex items-center gap-1.5"
                    >
                      <FaEye size={12} />
                      <span>View Recipe</span>
                    </button>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{r.prepTime || "20 mins"}</span>
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {/* Catalog Pagination */}
          {catalogTotalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                disabled={catalogPage === 1}
                className="px-4 py-2 rounded-xl bg-white border border-orange-100 text-xs font-bold text-gray-700 disabled:opacity-40 hover:bg-orange-50"
              >
                &larr; Previous
              </button>
              <span className="text-xs font-extrabold text-gray-600 px-3">
                Page {catalogPage} of {catalogTotalPages}
              </span>
              <button
                onClick={() => setCatalogPage((p) => Math.min(catalogTotalPages, p + 1))}
                disabled={catalogPage === catalogTotalPages}
                className="px-4 py-2 rounded-xl bg-white border border-orange-100 text-xs font-bold text-gray-700 disabled:opacity-40 hover:bg-orange-50"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 5: SAVED BOOKMARKS COLLECTION */}
      {activeTab === "saved" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-gray-900 font-headline">Saved Recipes Collection</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Your bookmarked Pakistani recipes with ingredients and cooking instructions.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("catalog")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md transition"
            >
              + Browse 650+ Catalog
            </button>
          </div>

          {savedRecipes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-orange-100 space-y-4">
              <FaBookmark size={36} className="text-orange-400 mx-auto" />
              <h4 className="text-lg font-bold text-gray-900">No Saved Recipes Yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Bookmark any recipe from the dashboard or catalog to access it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedRecipes.map((r, rIdx) => (
                <div
                  key={rIdx}
                  className="bg-white rounded-3xl p-5 border border-orange-100 shadow-lg shadow-orange-500/5 space-y-3 flex flex-col justify-between hover:shadow-xl transition"
                >
                  <div className="space-y-3">
                    <img
                      src={r.image || r.mealImageURL || "/assets/ingredients.jpeg"}
                      alt={r.recipeName || r.name}
                      className="w-full h-44 rounded-2xl object-cover border border-orange-100"
                      onError={(e) => {
                        e.target.src = "/assets/ingredients.jpeg";
                      }}
                    />
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-base font-headline">
                        {r.recipeName || r.name}
                      </h4>
                      {(r.recipeNameUrdu || r.urduName) && (
                        <p className="text-xs font-bold text-orange-600" dir="rtl">
                          {r.recipeNameUrdu || r.urduName}
                        </p>
                      )}
                      <div className="flex gap-3 text-xs font-bold text-gray-600 pt-1.5">
                        <span className="text-orange-500 font-extrabold">{r.calories} kcal</span>
                        <span>P: {r.protein}g</span>
                        <span>C: {r.carbs}g</span>
                        <span>F: {r.fat || r.fats || 0}g</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-orange-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedRecipeModal(r)}
                      className="text-xs font-extrabold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      <FaEye size={12} />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => handleSaveRecipe(r)}
                      className="text-xs font-bold text-red-500 hover:text-red-600"
                    >
                      Remove Bookmark
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. INSPECT SAVED PLAN FULL MULTI-DAY MODAL (Portal to document.body) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {inspectingPlan && (
            <div
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-5"
              onClick={() => setInspectingPlan(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl max-h-[88vh] overflow-y-auto border border-orange-100 space-y-6 relative select-none"
              >
                {/* Close Button */}
                <button
                  onClick={() => setInspectingPlan(null)}
                  className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-orange-50 text-gray-500 hover:text-orange-500 flex items-center justify-center transition cursor-pointer"
                >
                  <FaTimes size={14} />
                </button>

                {/* Plan Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
                  <div>
                    <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-3 py-1 rounded-full uppercase">
                      {inspectingDays.length} Days Schedule Breakdown
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 font-headline mt-1">
                      {formatDietaryTitle(inspectingPlan.dietaryType)}
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">
                      Target: <strong className="text-orange-600">{inspectingPlan.targetCalories || inspectingPlan.dailyCalorieTarget || 2000} kcal / day</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setLatestPlan(inspectingPlan);
                      setActivePlanDayIdx(0);
                      setInspectingPlan(null);
                      setActiveTab("meals");
                      toast.success("Loaded plan into active schedule!");
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md transition self-start sm:self-auto cursor-pointer"
                  >
                    Set as Active Schedule
                  </button>
                </div>

                {/* Days Selector */}
                {inspectingDays.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 border-b border-orange-100">
                    {inspectingDays.map((d, dIdx) => (
                      <button
                        key={dIdx}
                        onClick={() => setInspectingPlanDayIdx(dIdx)}
                        className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                          inspectingPlanDayIdx === dIdx
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                            : "bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-200"
                        }`}
                      >
                        Day {d.day || dIdx + 1}
                      </button>
                    ))}
                  </div>
                )}

                {/* Meals Grid for Active Inspected Day */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inspectingMeals.map((meal, mIdx) => {
                    const labels = ["Breakfast", "Lunch", "Snack / Tea", "Dinner"];
                    const slot = meal.assignedMealSlot || meal.mealType || labels[mIdx] || "Meal Slot";
                    const img = meal.mealImageURL || meal.meal_image_url || meal.image || "/assets/ingredients.jpeg";

                    return (
                      <div
                        key={mIdx}
                        className="p-4 rounded-2xl border border-orange-100 bg-orange-50/20 flex gap-4 items-start"
                      >
                        <img
                          src={img}
                          alt={meal.recipeName}
                          className="w-20 h-20 rounded-xl object-cover border border-orange-100 shrink-0"
                          onError={(e) => {
                            e.target.src = "/assets/ingredients.jpeg";
                          }}
                        />
                        <div className="space-y-1 flex-1">
                          <span className="text-[9px] font-black uppercase text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                            {slot}
                          </span>
                          <h4 className="text-sm font-extrabold text-gray-900 font-headline line-clamp-1">
                            {meal.recipeName}
                          </h4>
                          {meal.urduName && (
                            <p className="text-[11px] font-bold text-orange-600 truncate" dir="rtl">
                              {meal.urduName}
                            </p>
                          )}
                          <div className="flex gap-2.5 text-[11px] font-bold text-gray-600 pt-0.5">
                            <span className="text-orange-600">{meal.calories} kcal</span>
                            <span>P: {meal.protein}g</span>
                            <span>C: {meal.carbs}g</span>
                            <span>F: {meal.fat || meal.fats || 0}g</span>
                          </div>
                          <button
                            onClick={() => setSelectedRecipeModal(meal)}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 pt-1 block cursor-pointer"
                          >
                            View Cooking Method &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 9. PREMIUM RECIPE DETAILS POPUP MODAL (Portal to document.body) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedRecipeModal && (
            <div
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-5"
              onClick={() => setSelectedRecipeModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-orange-100/90 relative select-none"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedRecipeModal(null)}
                  className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md hover:bg-orange-50 text-gray-600 hover:text-orange-600 flex items-center justify-center transition shadow-md border border-gray-200/60 cursor-pointer"
                >
                  <FaTimes size={13} />
                </button>

                {/* Hero Banner with Dish Image & Floating Tags */}
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gray-900 shrink-0">
                  <img
                    src={
                      selectedRecipeModal.mealImageURL ||
                      selectedRecipeModal.meal_image_url ||
                      selectedRecipeModal.image ||
                      "/assets/ingredients.jpeg"
                    }
                    alt={selectedRecipeModal.recipeName || selectedRecipeModal.name}
                    className="w-full h-full object-cover opacity-85"
                    onError={(e) => {
                      e.target.src = "/assets/ingredients.jpeg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                  {/* Badges on Hero */}
                  <div className="absolute top-3.5 left-4 flex gap-2 flex-wrap z-10">
                    <span className="bg-orange-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md">
                      {selectedRecipeModal.assignedMealSlot || selectedRecipeModal.mealType || "Recipe Slot"}
                    </span>
                    <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-white/30">
                      {selectedRecipeModal.dietaryType || "Desi"}
                    </span>
                  </div>

                  {/* Title and Urdu Calligraphy on Hero */}
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <div className="flex justify-between items-end gap-3">
                      <div className="space-y-0.5">
                        <h3 className="text-xl sm:text-2xl font-black font-headline tracking-tight text-white drop-shadow-md line-clamp-1">
                          {selectedRecipeModal.recipeName || selectedRecipeModal.name}
                        </h3>
                        {(selectedRecipeModal.recipeNameUrdu || selectedRecipeModal.urduName) && (
                          <p className="text-xs sm:text-sm font-bold text-orange-400 drop-shadow-sm truncate" dir="rtl">
                            {selectedRecipeModal.recipeNameUrdu || selectedRecipeModal.urduName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 shrink-0">
                        <FaClock className="text-orange-400" size={11} />
                        <span>{selectedRecipeModal.preparationTime || selectedRecipeModal.prepTime || "20 mins"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Macro Bar (Fixed) */}
                <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-orange-50/50 border-b border-orange-100 shrink-0">
                  <div className="text-center p-1.5 rounded-xl bg-white border border-orange-100 shadow-2xs">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Calories</span>
                    <span className="text-sm sm:text-base font-black text-orange-600 font-headline">
                      {selectedRecipeModal.calories} <span className="text-[10px] font-bold text-gray-400">kcal</span>
                    </span>
                  </div>
                  <div className="text-center p-1.5 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Protein</span>
                    <span className="text-sm sm:text-base font-black text-emerald-700 font-headline">
                      {selectedRecipeModal.protein} <span className="text-[10px] font-bold text-gray-400">g</span>
                    </span>
                  </div>
                  <div className="text-center p-1.5 rounded-xl bg-white border border-amber-100 shadow-2xs">
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block">Carbs</span>
                    <span className="text-sm sm:text-base font-black text-amber-700 font-headline">
                      {selectedRecipeModal.carbs} <span className="text-[10px] font-bold text-gray-400">g</span>
                    </span>
                  </div>
                  <div className="text-center p-1.5 rounded-xl bg-white border border-purple-100 shadow-2xs">
                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest block">Fats</span>
                    <span className="text-sm sm:text-base font-black text-purple-700 font-headline">
                      {selectedRecipeModal.fat || selectedRecipeModal.fats || 0} <span className="text-[10px] font-bold text-gray-400">g</span>
                    </span>
                  </div>
                </div>

                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 overscroll-contain">
                  {/* 1. Required Ingredients Section */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                        <FaUtensils className="text-orange-500" size={11} />
                        <span>Required Fresh Ingredients</span>
                      </h4>
                      <span className="text-[11px] font-bold text-gray-400">
                        {Array.isArray(selectedRecipeModal.ingredients) ? `${selectedRecipeModal.ingredients.length} items` : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Array.isArray(selectedRecipeModal.ingredients) && selectedRecipeModal.ingredients.length > 0 ? (
                        selectedRecipeModal.ingredients.map((ing, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-2xl bg-gray-50/90 hover:bg-orange-50/50 border border-gray-200/80 flex justify-between items-center transition"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                              <span className="text-xs font-extrabold text-gray-800 line-clamp-1">
                                {typeof ing === "object" ? (ing.englishName || ing.name) : ing}
                              </span>
                            </div>
                            {typeof ing === "object" && (
                              <div className="text-right shrink-0">
                                {ing.urduName && (
                                  <span className="text-[10px] font-bold text-orange-600 block" dir="rtl">
                                    {ing.urduName}
                                  </span>
                                )}
                                <span className="text-[11px] font-black text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                  {ing.quantity}
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl">
                          Traditional fresh Pakistani ingredients calibrated in recipe.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2. Step-by-Step Cooking Method (English) */}
                  <div className="space-y-2.5 pt-2 border-t border-orange-100">
                    <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                      <FaClock className="text-orange-500" size={11} />
                      <span>Preparation & Cooking Method (English)</span>
                    </h4>

                    <div className="space-y-2">
                      {Array.isArray(selectedRecipeModal.instructions) && selectedRecipeModal.instructions.length > 0 ? (
                        selectedRecipeModal.instructions.map((step, sIdx) => {
                          const stepText = typeof step === "string" ? step.replace(/^Step \d+:\s*/i, "") : String(step);
                          return (
                            <div
                              key={sIdx}
                              className="p-3 rounded-2xl bg-gray-50/70 border border-gray-200/70 flex gap-3 items-start"
                            >
                              <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                {sIdx + 1}
                              </span>
                              <p className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                                {stepText}
                              </p>
                            </div>
                          );
                        })
                      ) : selectedRecipeModal.instructions ? (
                        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 leading-relaxed">
                          {selectedRecipeModal.instructions}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">
                          Prepare and cook according to traditional Pakistani recipe methods.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. Urdu Instructions (طریقہ کار) */}
                  {(selectedRecipeModal.instructionsUrdu || selectedRecipeModal.instructions_ur) && (
                    <div className="space-y-2.5 pt-2 border-t border-orange-100" dir="rtl">
                      <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest text-right">
                        طریقہ کار (Urdu Instructions)
                      </h4>

                      <div className="space-y-2">
                        {Array.isArray(selectedRecipeModal.instructionsUrdu || selectedRecipeModal.instructions_ur) ? (
                          (selectedRecipeModal.instructionsUrdu || selectedRecipeModal.instructions_ur).map(
                            (step, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-3 rounded-2xl bg-orange-50/30 border border-orange-100 flex gap-3 items-start text-right"
                              >
                                <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                  {sIdx + 1}
                                </span>
                                <p className="text-xs sm:text-sm text-gray-900 font-bold leading-relaxed">
                                  {step}
                                </p>
                              </div>
                            )
                          )
                        ) : (
                          <div className="p-3 rounded-2xl bg-orange-50/30 border border-orange-100 text-xs sm:text-sm text-gray-900 font-bold leading-relaxed text-right">
                            {selectedRecipeModal.instructionsUrdu || selectedRecipeModal.instructions_ur}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed Modal Footer Actions */}
                <div className="p-3.5 sm:p-4 bg-gray-50/90 border-t border-gray-200/80 shrink-0 flex justify-between items-center gap-3">
                  <button
                    onClick={() => handleSaveRecipe(selectedRecipeModal)}
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-orange-600 hover:text-orange-700 bg-white hover:bg-orange-50 px-4 py-2 rounded-full border border-orange-200 transition shadow-2xs cursor-pointer"
                  >
                    <FaBookmark size={11} />
                    <span>Bookmark Recipe</span>
                  </button>

                  <button
                    onClick={() => setSelectedRecipeModal(null)}
                    className="bg-gray-900 hover:bg-black text-white font-bold text-xs px-5 py-2 rounded-full transition shadow-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
