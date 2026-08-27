"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { toast } from "react-toastify";
import useWizardStore from "../../store/wizardStore";
import { FaCalendarAlt, FaFire, FaCheckCircle, FaArrowRight, FaUtensils } from "react-icons/fa";

export default function NumberOfDaysPage() {
  const router = useRouter();
  const {
    weightGoal,
    dietaryType,
    mealType,
    dailyCalories,
    setLatestGeneratedPlan,
  } = useWizardStore();

  const [noOfDays, setNoOfDays] = useState(3);
  const [loading, setLoading] = useState(false);

  const presetDays = [1, 3, 5, 7];

  const handleGenerate = async () => {
    if (!noOfDays || Number(noOfDays) <= 0) {
      toast.error("Please specify a valid duration.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        weightGoal: weightGoal || "weight_loss",
        dietaryType: dietaryType || "desi",
        mealType: Array.isArray(mealType) ? mealType : ["Breakfast", "Lunch", "Dinner"],
        noOfDays: Number(noOfDays),
        dailyCalories: Number(dailyCalories || 2000),
      };

      const { data } = await api.post("/mealplan/generate", payload);

      if (data?.mealPlan) {
        setLatestGeneratedPlan(data.mealPlan);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("latest_generated_meal_plan", JSON.stringify(data.mealPlan));
        }
        toast.success("Personalized meal plan generated successfully!");
        router.push("/meal-plan-result");
      } else {
        throw new Error("No meal plan returned from server.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to generate meal plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8 text-gray-800 text-center">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mx-auto shadow-sm">
          <FaCalendarAlt size={28} />
        </div>
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
          Final Step
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 font-headline">
          How Long Is Your Plan?
        </h1>
        <p className="text-gray-600 text-sm max-w-sm mx-auto">
          Choose the number of days you want our AI optimizer to schedule customized meals for.
        </p>
      </div>

      {/* Main Selection Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md space-y-6">
        {/* Presets */}
        <div className="grid grid-cols-4 gap-3">
          {presetDays.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setNoOfDays(d)}
              className={`py-3.5 rounded-2xl border-2 font-bold text-sm text-center transition-all ${
                noOfDays === d
                  ? "border-orange-500 bg-orange-500 text-white shadow-md"
                  : "border-orange-100 bg-orange-50/40 text-gray-700 hover:border-orange-300"
              }`}
            >
              {d} {d === 1 ? "Day" : "Days"}
            </button>
          ))}
        </div>

        {/* Custom Slider / Input */}
        <div className="space-y-3 bg-orange-50/50 p-5 rounded-2xl border border-orange-100 text-left">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Custom Duration (1 to 14 Days)
            </label>
            <span className="text-lg font-black text-orange-600 font-headline">
              {noOfDays} Days
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="14"
            value={noOfDays}
            onChange={(e) => setNoOfDays(Number(e.target.value))}
            className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Plan Configuration Summary */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-600 grid grid-cols-2 gap-2 text-left">
          <div>Diet: <strong className="text-gray-900 capitalize">{dietaryType || "Desi"}</strong></div>
          <div>Goal: <strong className="text-gray-900 capitalize">{(weightGoal || "weight_loss").replace("_", " ")}</strong></div>
          <div>Daily Target: <strong className="text-orange-500 font-bold">{dailyCalories || 2000} kcal</strong></div>
          <div>Meals / Day: <strong className="text-gray-900">{Array.isArray(mealType) ? mealType.length : 3} Slots</strong></div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-base py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              <span>Optimizing Pakistani Recipes...</span>
            </div>
          ) : (
            <>
              <FaUtensils size={14} />
              <span>Generate My Meal Plan 🚀</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
