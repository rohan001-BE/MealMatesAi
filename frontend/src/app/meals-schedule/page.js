"use client";

import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";
import { FaClock, FaCheck, FaSave, FaUtensils, FaCoffee, FaMoon, FaCookieBite } from "react-icons/fa";

const mealSlotsConfig = [
  {
    id: "breakfast",
    name: "Breakfast Slot",
    typicalTime: "08:00 AM - 09:30 AM",
    desc: "Kickstart metabolic expenditure with eggs, paratha/oats, and high-protein fuel.",
    icon: <FaCoffee size={20} />,
  },
  {
    id: "lunch",
    name: "Lunch Slot",
    typicalTime: "01:00 PM - 02:30 PM",
    desc: "Sustain daytime focus and energy reserves with complex carbs, chicken/meat, and lentils.",
    icon: <FaUtensils size={20} />,
  },
  {
    id: "dinner",
    name: "Dinner Slot",
    typicalTime: "07:30 PM - 09:00 PM",
    desc: "Light, easily digestible protein and vegetables to optimize recovery and deep sleep.",
    icon: <FaMoon size={20} />,
  },
  {
    id: "snack",
    name: "Evening Snack / Chai Slot",
    typicalTime: "04:30 PM - 05:30 PM",
    desc: "Healthy afternoon snack or nuts to prevent hunger spikes before dinner.",
    icon: <FaCookieBite size={20} />,
  },
];

export default function MealsSchedulePage() {
  const { user, setUser } = useAuthStore();
  const [selectedSlots, setSelectedSlots] = useState(["breakfast", "lunch", "dinner"]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMealSlots = async () => {
      try {
        const { data } = await api.get("/users/meal-type");
        if (Array.isArray(data?.mealType) && data.mealType.length > 0) {
          setSelectedSlots(data.mealType);
        } else if (Array.isArray(user?.mealType) && user.mealType.length > 0) {
          setSelectedSlots(user.mealType);
        }
      } catch (err) {
        if (Array.isArray(user?.mealType) && user.mealType.length > 0) {
          setSelectedSlots(user.mealType);
        }
      }
    };
    fetchMealSlots();
  }, [user]);

  const toggleSlot = (id) => {
    if (selectedSlots.includes(id)) {
      if (selectedSlots.length <= 1) {
        toast.warning("You must have at least 1 meal slot selected.");
        return;
      }
      setSelectedSlots((prev) => prev.filter((s) => s !== id));
    } else {
      setSelectedSlots((prev) => [...prev, id]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/users/update-meal-type", {
        mealType: selectedSlots,
      });
      if (user) {
        setUser({ ...user, mealType: selectedSlots });
      }
      toast.success("Meal schedule slots updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update meal schedule slots.");
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
            Timing & Frequency Configuration
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
            Daily Meal Slots
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose which meals you eat daily. Our meal planner divides your calorie targets across these slots.
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
          <span>{loading ? "Saving..." : "Save Schedule"}</span>
        </button>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {mealSlotsConfig.map((slot) => {
          const isSelected = selectedSlots.includes(slot.id);
          return (
            <div
              key={slot.id}
              onClick={() => toggleSlot(slot.id)}
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
                    {slot.icon}
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

                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-headline">{slot.name}</h3>
                  <span className="inline-block text-[11px] font-bold text-orange-500 bg-orange-50 px-2.5 py-0.5 rounded-full mt-1">
                    {slot.typicalTime}
                  </span>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed font-medium">{slot.desc}</p>
              </div>

              <div className="pt-2 text-right">
                <span
                  className={`text-xs font-bold ${
                    isSelected ? "text-orange-500" : "text-gray-400"
                  }`}
                >
                  {isSelected ? "Active in Planner ✓" : "Click to Enable"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
