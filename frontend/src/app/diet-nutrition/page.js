"use client";

import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";
import { FaAppleAlt, FaCheck, FaSave, FaLeaf, FaUtensils, FaDumbbell } from "react-icons/fa";

const dietaryOptions = [
  {
    id: "desi",
    title: "Desi Pakistani Diet",
    desc: "Traditional South Asian cuisine with Daal, Roti, Chicken, and vegetable curries cooked with balanced healthy oils.",
    icon: <FaUtensils size={20} />,
  },
  {
    id: "keto",
    title: "Ketogenic (Low Carb)",
    desc: "Ultra-low carbohydrate, high healthy fats, and moderate protein to promote metabolic ketosis.",
    icon: <FaAppleAlt size={20} />,
  },
  {
    id: "high_protein",
    title: "High Protein & Fitness",
    desc: "Optimized for muscle preservation, strength training, and athletic performance with 30-35% protein split.",
    icon: <FaDumbbell size={20} />,
  },
  {
    id: "vegetarian",
    title: "Vegetarian / Sabzi",
    desc: "Plant-powered recipes featuring lentils, chickpeas, paneer, and seasonal fresh vegetables.",
    icon: <FaLeaf size={20} />,
  },
  {
    id: "vegan",
    title: "100% Plant-Based Vegan",
    desc: "Zero meat, dairy, or animal byproducts with nutrient-dense legumes, grains, and nuts.",
    icon: <FaLeaf size={20} />,
  },
  {
    id: "balanced",
    title: "Standard Balanced Diet",
    desc: "Wholesome macronutrient ratio (45% Carbs, 25% Protein, 30% Healthy Fats) prioritizing whole foods.",
    icon: <FaAppleAlt size={20} />,
  },
];

export default function DietNutritionPage() {
  const { user, setUser } = useAuthStore();
  const [selectedDiet, setSelectedDiet] = useState("desi");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchDiet = async () => {
      try {
        const { data } = await api.get("/users/dietary-type");
        if (data?.dietaryType) {
          setSelectedDiet(data.dietaryType);
        } else if (user?.dietaryType) {
          setSelectedDiet(user.dietaryType);
        }
      } catch (err) {
        if (user?.dietaryType) setSelectedDiet(user.dietaryType);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchDiet();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/users/update-dietary-type", {
        dietaryType: selectedDiet,
      });
      if (user) {
        setUser({ ...user, dietaryType: selectedDiet });
      }
      toast.success("Dietary preference updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update dietary preference.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10 text-gray-800">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block mb-1">
            Nutritional Configuration
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
            Dietary Type Preference
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Select your preferred culinary style. Our AI candidate finder will prioritize matching meals.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-full px-7 py-3 shadow-md transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <FaSave size={13} />
          )}
          <span>{loading ? "Saving..." : "Save Preference"}</span>
        </button>
      </div>

      {/* Diet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dietaryOptions.map((opt) => {
          const isSelected = selectedDiet === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => setSelectedDiet(opt.id)}
              className={`bg-white rounded-3xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-md ${
                isSelected
                  ? "border-orange-500 shadow-sm bg-orange-50/20"
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

                <h3 className="text-xl font-bold text-gray-900 font-headline">{opt.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">{opt.desc}</p>
              </div>

              <div className="pt-2 text-right">
                <span
                  className={`text-xs font-bold ${
                    isSelected ? "text-orange-500" : "text-gray-400"
                  }`}
                >
                  {isSelected ? "Active Selection ✓" : "Click to Select"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
