"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { toast } from "react-toastify";
import useWizardStore from "../../store/wizardStore";
import { FaArrowRight, FaLeaf, FaPizzaSlice, FaFish, FaUtensils, FaDumbbell, FaCheck } from "react-icons/fa";

const dietaryOptions = [
  {
    label: "Desi",
    icon: <FaUtensils size={20} />,
    value: "desi",
    excludes: "Heavy Processed Oils, Sugary Desserts",
    description: "Traditional Pakistani South Asian cuisine with Daal, Roti, Chicken, and vegetable curries.",
  },
  {
    label: "High Protein",
    icon: <FaDumbbell size={20} />,
    value: "high_protein",
    excludes: "Refined sugary carbs",
    description: "Optimized for muscle preservation, strength training, and active fitness lifestyles.",
  },
  {
    label: "Keto",
    icon: <FaPizzaSlice size={20} />,
    value: "keto",
    excludes: "Legumes, Starchy Vegetables, High-carb Grains",
    description: "High-fat, low-carb diet focusing on healthy fats and proteins.",
  },
  {
    label: "Vegetarian",
    icon: <FaLeaf size={20} />,
    value: "vegetarian",
    excludes: "Red Meat, Poultry, Fish, Shellfish",
    description: "Plant-based diet including lentils, chickpeas, paneer, and eggs.",
  },
  {
    label: "Vegan",
    icon: <FaLeaf size={20} />,
    value: "vegan",
    excludes: "All Animal Products (Meat, Poultry, Fish, Dairy, Eggs)",
    description: "100% plant-powered food groups excluding all animal products.",
  },
  {
    label: "Balanced",
    icon: <FaFish size={20} />,
    value: "balanced",
    excludes: "Heavy Processed Foods",
    description: "Standard balanced macronutrient ratio focusing on whole foods and clean proteins.",
  },
];

export default function DietaryTypePage() {
  const router = useRouter();
  const { dietaryType, setDietaryType } = useWizardStore();

  // Multi-select state: Initialize from store or default to ["desi"]
  const [selectedDiets, setSelectedDiets] = useState(() => {
    if (Array.isArray(dietaryType)) return dietaryType;
    if (typeof dietaryType === "string" && dietaryType) {
      return dietaryType.split(",").map((s) => s.trim().toLowerCase());
    }
    return ["desi"];
  });

  const [loading, setLoading] = useState(false);

  const toggleDiet = (val) => {
    setSelectedDiets((prev) => {
      if (prev.includes(val)) {
        if (prev.length === 1) {
          toast.info("Please keep at least one dietary style selected.");
          return prev;
        }
        return prev.filter((d) => d !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const handleNext = async () => {
    if (!selectedDiets || selectedDiets.length === 0) {
      toast.error("Please select at least one dietary preference.");
      return;
    }
    setLoading(true);
    const combinedString = selectedDiets.join(", ");
    try {
      await api.put("/users/update-dietary-type", { dietaryType: combinedString });
      setDietaryType(selectedDiets.length === 1 ? selectedDiets[0] : combinedString);
      router.push("/meal-type");
    } catch (error) {
      setDietaryType(selectedDiets.length === 1 ? selectedDiets[0] : combinedString);
      router.push("/meal-type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8 text-gray-800">
      {/* Header */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-bold uppercase tracking-wider mb-1">
          <span>Meal Planning Wizard</span>
          <span>&bull;</span>
          <span>Multi-Select Enabled</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 font-headline">
          Select Your Dietary Style
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          Choose one or multiple dietary modes. Our ML optimizer will combine recipe candidates matching your selections.
        </p>
      </div>

      {/* Grid Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {dietaryOptions.map((opt) => {
          const isSelected = selectedDiets.includes(opt.value);
          return (
            <div
              key={opt.value}
              onClick={() => toggleDiet(opt.value)}
              className={`bg-white rounded-3xl p-5 sm:p-6 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-lg select-none transform active:scale-98 ${
                isSelected
                  ? "border-orange-500 shadow-md shadow-orange-500/10 bg-orange-50/20"
                  : "border-orange-100 hover:border-orange-200"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      isSelected ? "bg-orange-500 text-white shadow-sm" : "bg-orange-50 text-orange-500"
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-orange-500 bg-orange-500 text-white shadow-xs"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && <FaCheck size={10} />}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-headline flex items-center gap-2">
                    <span>{opt.label}</span>
                    {isSelected && (
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-extrabold">
                        Selected
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium mt-1">
                    {opt.description}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-orange-100/60">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  Excludes:
                </span>
                <span className="text-[11px] text-gray-600 font-medium line-clamp-1">
                  {opt.excludes}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Step CTA */}
      <div className="text-center pt-2">
        <div className="text-xs font-bold text-gray-500 mb-3">
          {selectedDiets.length} style{selectedDiets.length !== 1 ? "s" : ""} selected
        </div>
        <button
          onClick={handleNext}
          disabled={loading}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base rounded-full px-10 py-4 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
        >
          <span>Continue to Meal Frequency</span>
          <FaArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
