"use client";

import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "react-toastify";
import useWizardStore from "../../store/wizardStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTrash,
  FaEye,
  FaCalendarAlt,
  FaUtensils,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaFire,
  FaClock,
} from "react-icons/fa";

export default function MyMealPlans() {
  const router = useRouter();
  const { setLatestGeneratedPlan } = useWizardStore();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [openSection, setOpenSection] = useState(null);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get("/mealplan/all");
      const list = data.mealPlans || [];
      const sorted = list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setPlans(sorted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load historical meal plans.");
    } finally {
      setLoading(false);
    }
  };

  const formatDietaryTitle = (dietaryType) => {
    if (!dietaryType) return "Desi Nutritional Plan";
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
    if (formatted.length === 0) return "Nutritional Plan";
    if (formatted.length === 1) return `${formatted[0]} Plan`;
    return `${formatted.join(" • ")} Plan`;
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenResult = (plan) => {
    setLatestGeneratedPlan(plan);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("latest_generated_meal_plan", JSON.stringify(plan));
    }
    router.push("/meal-plan-result");
  };

  const confirmDelete = async () => {
    if (!selectedPlanId) return;
    try {
      await api.delete(`/mealplan/${selectedPlanId}`);
      toast.success("Meal plan deleted successfully!");
      setPlans((prev) => prev.filter((p) => (p.id || p._id) !== selectedPlanId));
      if (expandedPlanId === selectedPlanId) setExpandedPlanId(null);
    } catch (err) {
      toast.error("Failed to delete meal plan.");
    } finally {
      setDeleteModalOpen(false);
      setSelectedPlanId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-gray-800">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block mb-1">
            User History & Archives
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
            Saved Meal Plans
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Access, view, and inspect your previously generated meal plans stored in Firestore.
          </p>
        </div>

        <button
          onClick={() => router.push("/meal-planner")}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-full px-6 py-3 shadow-md transition-all self-start sm:self-auto"
        >
          <FaUtensils size={13} />
          <span>New Meal Plan</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-3" />
          <p className="text-sm font-semibold text-gray-500">Loading your meal plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mx-auto">
            <FaUtensils size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">No Saved Plans Found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            You haven't saved any meal plans yet. Use our AI meal planner to generate your first diet schedule!
          </p>
          <button
            onClick={() => router.push("/meal-planner")}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-full px-6 py-2.5 shadow-sm transition"
          >
            Start Planning
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan, planIdx) => {
            const planId = plan.id || plan._id || `plan-${planIdx}`;
            const isExpanded = expandedPlanId === planId;
            const days = plan.mealPlans || [];
            const createdDate = plan.createdAt
              ? new Date(plan.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Recently saved";

            return (
              <div
                key={planId}
                className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                {/* Plan Summary Bar */}
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                      <FaCalendarAlt size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900 font-headline">
                        {formatDietaryTitle(plan.dietaryType)} ({days.length} Days)
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Created on {createdDate} &bull; Target:{" "}
                        <strong className="text-orange-500 font-bold">
                          {plan.dailyCalorieTarget || days[0]?.totalCalories || 2000} kcal/day
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleOpenResult(plan)}
                      className="inline-flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-full px-4 py-2 text-xs font-bold transition"
                    >
                      <FaEye size={12} />
                      <span>Full View</span>
                    </button>
                    <button
                      onClick={() => setExpandedPlanId(isExpanded ? null : planId)}
                      className="p-2.5 rounded-full bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-500 border border-gray-200 transition"
                      title={isExpanded ? "Collapse" : "Quick preview"}
                    >
                      {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlanId(planId);
                        setDeleteModalOpen(true);
                      }}
                      className="p-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 transition"
                      title="Delete Plan"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>

                {/* Expanded Inline Preview */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-orange-100 bg-orange-50/30 p-6 space-y-6"
                    >
                      {days.map((day, dIdx) => (
                        <div key={dIdx} className="space-y-4">
                          <h4 className="text-sm font-extrabold text-orange-600 uppercase tracking-wider">
                            Day {day.day || dIdx + 1} ({day.totalCalories} kcal)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {(day.recipes || []).map((recipe, rIdx) => (
                              <div
                                key={rIdx}
                                className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm flex items-center gap-3"
                              >
                                <img
                                  src={recipe.mealImageURL || recipe.image || "/assets/ingredients.jpeg"}
                                  alt={recipe.recipeName || recipe.name}
                                  className="w-16 h-16 rounded-xl object-cover border border-orange-50 shrink-0"
                                  onError={(e) => {
                                    e.target.src = "/assets/ingredients.jpeg";
                                  }}
                                />
                                <div className="overflow-hidden">
                                  <span className="text-[9px] font-bold text-orange-500 uppercase">
                                    {recipe.mealType || recipe.type || "Meal"}
                                  </span>
                                  <h5 className="font-bold text-xs text-gray-900 truncate">
                                    {recipe.recipeName || recipe.name}
                                  </h5>
                                  <p className="text-[10px] text-gray-500 font-medium">
                                    {recipe.calories} kcal &bull; P: {recipe.nutrients?.protein || recipe.protein || 0}g
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-orange-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2 font-headline">Delete Meal Plan?</h3>
            <p className="text-xs text-gray-500 mb-6">
              Are you sure you want to remove this meal plan from your saved history? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
