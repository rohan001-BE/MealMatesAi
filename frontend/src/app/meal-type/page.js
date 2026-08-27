"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import useWizardStore from "../../store/wizardStore";
import { FaArrowRight, FaCoffee, FaUtensils, FaMoon, FaCookieBite, FaCheck } from "react-icons/fa";

const mealOptions = [
  {
    label: "Breakfast",
    icon: <FaCoffee size={20} />,
    description: "Start your day with balanced carbohydrates, healthy fats, and high-quality protein.",
    time: "08:00 AM - 09:30 AM",
  },
  {
    label: "Lunch",
    icon: <FaUtensils size={20} />,
    description: "Midday fueling to maintain metabolic energy levels and sustain concentration.",
    time: "01:00 PM - 02:30 PM",
  },
  {
    label: "Dinner",
    icon: <FaMoon size={20} />,
    description: "Evening protein to support muscular recovery and restful sleep.",
    time: "07:30 PM - 09:00 PM",
  },
  {
    label: "Snack / Tea",
    icon: <FaCookieBite size={20} />,
    description: "Light afternoon bite or chai snack to stabilize blood sugar levels.",
    time: "04:30 PM - 05:30 PM",
  },
];

export default function MealTypePage() {
  const router = useRouter();
  const { mealType, setMealType } = useWizardStore();
  const [selectedMeals, setSelectedMeals] = useState(
    Array.isArray(mealType) && mealType.length > 0 ? mealType : ["Breakfast", "Lunch", "Dinner"]
  );

  const toggleMeal = (label) => {
    if (selectedMeals.includes(label)) {
      if (selectedMeals.length <= 1) {
        toast.warning("Please keep at least 1 meal category selected.");
        return;
      }
      setSelectedMeals((prev) => prev.filter((m) => m !== label));
    } else {
      setSelectedMeals((prev) => [...prev, label]);
    }
  };

  const handleNext = () => {
    if (selectedMeals.length === 0) {
      toast.error("Please select at least one meal category.");
      return;
    }
    setMealType(selectedMeals);
    router.push("/number-of-days");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10 text-gray-800">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
          Meal Planning Wizard
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 font-headline">
          Select Daily Meal Slots
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-lg mx-auto">
          Choose which daily eating slots to schedule. We divide your daily calorie ceiling across these choices.
        </p>
      </div>

      {/* Grid Selections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mealOptions.map((opt) => {
          const isSelected = selectedMeals.includes(opt.label);
          return (
            <div
              key={opt.label}
              onClick={() => toggleMeal(opt.label)}
              className={`bg-white rounded-3xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-md ${
                isSelected
                  ? "border-orange-500 shadow-md bg-orange-50/20"
                  : "border-orange-100 hover:border-orange-200"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isSelected ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-500"
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      isSelected
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && <FaCheck size={10} />}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 font-headline">{opt.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">{opt.description}</p>
              </div>

              <div className="pt-2 border-t border-orange-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  Timing:
                </span>
                <span className="text-[11px] text-gray-600 font-medium">
                  {opt.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Step CTA */}
      <div className="text-center pt-4">
        <button
          onClick={handleNext}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base rounded-full px-10 py-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <span>Continue to Duration Selection</span>
          <FaArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
