"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { regenerateMealPlan } from "../../../lib/api";
import { toast } from "react-toastify";
import { FaSyncAlt, FaUtensils, FaChevronDown, FaChevronUp, FaInfoCircle, FaArrowLeft } from "react-icons/fa";

export default function MealPlannerResult() {
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedPlan = sessionStorage.getItem("latest_generated_meal_plan");
      if (savedPlan) {
        setMealPlan(JSON.parse(savedPlan));
      }
    }
  }, []);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const { data } = await regenerateMealPlan();
      if (data?.success && data?.mealPlan) {
        setMealPlan(data.mealPlan);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("latest_generated_meal_plan", JSON.stringify(data.mealPlan));
        }
        toast.success("Meal plan regenerated successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to regenerate meal plan.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (!mealPlan || !mealPlan.mealPlans || mealPlan.mealPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <FaUtensils className="text-6xl text-primary/40" />
        <h3 className="text-2xl font-bold text-charcoal-text font-headline">No Meal Plan Found</h3>
        <p className="text-sm text-on-surface-variant max-w-sm font-medium">
          Configure metabolic constraints on the planner page to generate your personalized nutrition plan.
        </p>
        <Link
          href="/meal-planner"
          className="bg-primary hover:bg-orange-600 text-white rounded-full px-8 py-3 font-bold transition-all shadow-md flex items-center gap-2"
        >
          <FaArrowLeft size={12} />
          <span>Back to Planner</span>
        </Link>
      </div>
    );
  }

  const days = mealPlan.mealPlans;
  const currentDay = days[activeDayIdx] || days[0];
  const recipes = currentDay.recipes || [];

  return (
    <div className="space-y-10 animate-entrance">
      {/* Page Sticky Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-primary/5 pb-6">
        <div>
          <h2 className="text-4xl font-extrabold text-charcoal-text tracking-tight font-headline">Your Meal Plan</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Budget matching: Rs. {mealPlan.budget?.toLocaleString()} PKR
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="flex items-center gap-2 text-primary border border-primary/30 hover:bg-primary/5 rounded-full px-6 py-2.5 text-sm font-bold transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            ) : (
              <FaSyncAlt size={14} />
            )}
            <span>{loading ? "Swapping..." : "Regenerate Plan"}</span>
          </button>
        </div>
      </header>

      {/* Multi-Day Navigation Tabs */}
      <nav className="flex gap-2 border-b border-primary/5 overflow-x-auto pb-2">
        {days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => {
              setActiveDayIdx(idx);
              setOpenAccordion(null);
            }}
            className={`px-6 py-3 rounded-t-2xl font-bold text-sm border-b-2 transition-all shrink-0 ${
              activeDayIdx === idx
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-charcoal-text"
            }`}
          >
            Day {idx + 1}
          </button>
        ))}
      </nav>

      {/* Daily Metrics Split Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[28px] border border-primary/5 shadow-solaris">
          <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Target Calorie</span>
          <p className="text-2xl font-extrabold text-primary font-headline mt-1">
            {currentDay.totalCalories?.toLocaleString()} kcal
          </p>
        </div>
        <div className="bg-white p-6 rounded-[28px] border border-primary/5 shadow-solaris">
          <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Protein Split</span>
          <p className="text-2xl font-extrabold text-secondary font-headline mt-1">
            {currentDay.totalProtein}g
          </p>
        </div>
        <div className="bg-white p-6 rounded-[28px] border border-primary/5 shadow-solaris">
          <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Carbs Split</span>
          <p className="text-2xl font-extrabold text-tertiary-container font-headline mt-1">
            {currentDay.totalCarbs}g
          </p>
        </div>
        <div className="bg-white p-6 rounded-[28px] border border-primary/5 shadow-solaris">
          <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Fats Split</span>
          <p className="text-2xl font-extrabold text-primary-container font-headline mt-1">
            {currentDay.totalFat}g
          </p>
        </div>
      </div>

      {/* Recipes Cards and Drawer Dropdown details list */}
      <div className="space-y-6">
        {recipes.map((meal, mealIdx) => {
          const accordionKey = `${activeDayIdx}-${mealIdx}`;
          const isAccordionOpen = openAccordion === accordionKey;
          const types = ["Breakfast", "Lunch", "Dinner", "Snack"];
          const label = meal.type || types[mealIdx] || "Meal";

          return (
            <div
              key={mealIdx}
              className="bg-white rounded-[28px] border border-primary/5 shadow-solaris p-6 space-y-6"
            >
              {/* Recipe Layout */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                <img
                  src={meal.image || "/assets/ingredients.jpeg"}
                  alt={meal.name}
                  className="w-full md:w-44 h-32 rounded-2xl object-cover border border-primary/5"
                  onError={(e) => {
                    e.target.src = "/assets/ingredients.jpeg";
                  }}
                />
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">
                    {label}
                  </span>
                  <h4 className="text-xl font-bold text-charcoal-text font-headline leading-tight">
                    {meal.name}
                  </h4>
                  <div className="flex justify-center md:justify-start gap-4 text-xs font-semibold text-on-surface-variant">
                    <span>Cals: {meal.calories} kcal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fat || meal.fats}g</span>
                  </div>
                </div>

                <button
                  onClick={() => setOpenAccordion(isAccordionOpen ? null : accordionKey)}
                  className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-primary border border-primary/10 hover:bg-primary/5 transition-colors self-center md:self-auto"
                >
                  {isAccordionOpen ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                </button>
              </div>

              {/* Accordion content */}
              {isAccordionOpen && (
                <div className="border-t border-primary/5 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed text-charcoal-text animate-entrance">
                  {/* Ingredients */}
                  <div className="space-y-3">
                    <h5 className="font-bold flex items-center gap-2 text-primary font-headline uppercase text-xs tracking-wider">
                      <FaInfoCircle />
                      <span>Ingredients</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1 font-medium pl-2">
                      {Array.isArray(meal.ingredients) ? (
                        meal.ingredients.map((ing, idx) => <li key={idx}>{ing}</li>)
                      ) : meal.ingredients ? (
                        <li>{meal.ingredients}</li>
                      ) : (
                        <li className="text-on-surface-variant">Check packet labels/ingredients.</li>
                      )}
                    </ul>
                  </div>

                  {/* Directions */}
                  <div className="space-y-3">
                    <h5 className="font-bold flex items-center gap-2 text-primary font-headline uppercase text-xs tracking-wider">
                      <FaUtensils />
                      <span>Preparation Steps</span>
                    </h5>
                    <ol className="list-decimal list-inside space-y-1 font-medium pl-2">
                      {Array.isArray(meal.steps) ? (
                        meal.steps.map((step, idx) => <li key={idx}>{step}</li>)
                      ) : meal.steps ? (
                        <li>{meal.steps}</li>
                      ) : (
                        <li className="text-on-surface-variant">Wash, prepare, and serve raw or steam to taste.</li>
                      )}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
