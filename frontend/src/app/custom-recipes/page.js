"use client";

import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FaTrash,
  FaSearch,
  FaUtensils,
  FaClock,
  FaFire,
  FaLeaf,
  FaChevronDown,
  FaChevronUp,
  FaPlus,
} from "react-icons/fa";

export default function CustomRecipes() {
  const router = useRouter();
  const [customMeals, setCustomMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [expandedMealIdx, setExpandedMealIdx] = useState(null);

  const fetchCustomMeals = async () => {
    try {
      const { data } = await api.get("/users/get-custom-meals");
      const meals = data.customMeals || (Array.isArray(data) ? data : []);
      setCustomMeals(meals);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch saved custom meals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomMeals();
  }, []);

  const confirmDelete = async () => {
    if (selectedMealId === null) return;
    try {
      // delete by recipe ID or index
      await api.delete(`/users/delete-custom-meal/${selectedMealId}`);
      toast.success("Custom meal removed.");
      fetchCustomMeals();
    } catch (err) {
      toast.error("Failed to delete custom meal.");
    } finally {
      setDeleteModalOpen(false);
      setSelectedMealId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-gray-800">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block mb-1">
            Custom Recipes Collection
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
            Saved Custom Recipes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Recipes saved from your custom ingredient and macro searches.
          </p>
        </div>

        <button
          onClick={() => router.push("/custom-category")}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-full px-6 py-3 shadow-md transition-all self-start sm:self-auto"
        >
          <FaPlus size={12} />
          <span>New Custom Search</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-3" />
          <p className="text-sm font-semibold text-gray-500">Loading custom recipes...</p>
        </div>
      ) : customMeals.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mx-auto">
            <FaUtensils size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">No Saved Custom Recipes</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            You haven't saved any custom recipes yet. Use our custom search to discover dishes by ingredient or calorie target!
          </p>
          <button
            onClick={() => router.push("/custom-category")}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-full px-6 py-2.5 shadow-sm transition"
          >
            Explore Custom Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customMeals.map((meal, idx) => {
            const recipeId = meal.recipeId || meal.id || meal._id || idx;
            const isExpanded = expandedMealIdx === idx;

            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-orange-100 shadow-sm hover:shadow-md transition-all p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={meal.mealImageURL || meal.image || "/assets/ingredients.jpeg"}
                      alt={meal.recipeName || "Custom Recipe"}
                      className="w-24 h-24 rounded-2xl object-cover border border-orange-50 shrink-0"
                      onError={(e) => {
                        e.target.src = "/assets/ingredients.jpeg";
                      }}
                    />
                    <div className="flex-1 overflow-hidden space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2.5 py-0.5 rounded-full uppercase">
                          {meal.ingredientSearched ? `By ${meal.ingredientSearched}` : "Macro Matched"}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedMealId(recipeId);
                            setDeleteModalOpen(true);
                          }}
                          className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                          title="Remove"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                      <h4 className="font-extrabold text-base text-gray-900 truncate">
                        {meal.recipeName || "Custom Recipe"}
                      </h4>
                      <p className="text-xs text-gray-500 font-semibold">
                        {meal.calories} kcal
                      </p>
                    </div>
                  </div>

                  {meal.targetNutrient && (
                    <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-50 text-xs font-semibold text-gray-700 flex justify-between">
                      <span>Target Nutrient:</span>
                      <strong className="text-orange-600 capitalize">
                        {meal.targetNutrient.value}g {meal.targetNutrient.type}
                      </strong>
                    </div>
                  )}

                  {meal.restrictions && meal.restrictions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {meal.restrictions.map((r, i) => (
                        <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-orange-50 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Auto-calibrated for diet</span>
                  <button
                    onClick={() => router.push(`/meal-planner`)}
                    className="text-orange-500 hover:text-orange-600 font-bold"
                  >
                    Add to Plan &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-orange-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2 font-headline">Remove Custom Recipe?</h3>
            <p className="text-xs text-gray-500 mb-6">
              Are you sure you want to remove this recipe from your saved custom collection?
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
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
