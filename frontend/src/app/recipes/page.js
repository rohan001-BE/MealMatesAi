"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../../lib/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaUtensils,
  FaClock,
  FaFire,
  FaLeaf,
  FaBookmark,
  FaRegBookmark,
  FaEye,
  FaTimes,
  FaFilter,
  FaCheck,
  FaDumbbell,
  FaArrowLeft,
} from "react-icons/fa";
import Link from "next/link";

export default function RecipesPage() {
  const [mounted, setMounted] = useState(false);
  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMealType, setSelectedMealType] = useState("all");
  const [selectedDietaryType, setSelectedDietaryType] = useState("all");
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [selectedRecipeModal, setSelectedRecipeModal] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 24;

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const { data } = await api.get("/recipes/all");
        if (data?.recipes) {
          setAllRecipes(data.recipes);
        }
      } catch (err) {
        console.error("Failed to fetch full recipe catalog:", err);
      } finally {
        setLoading(false);
        setMounted(true);
      }
    };

    const fetchSaved = async () => {
      try {
        const { data } = await api.get("/users/dashboard");
        if (data?.savedRecipes) setSavedRecipes(data.savedRecipes);
      } catch (e) {}
    };

    fetchRecipes();
    fetchSaved();
  }, []);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (selectedRecipeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedRecipeModal]);

  const handleSaveRecipe = async (meal) => {
    const mealName = meal.recipeName || meal.name;
    try {
      const isAlreadySaved = savedRecipes.some((r) => (r.recipeName || r.name) === mealName);
      if (isAlreadySaved) {
        await api.delete(`/users/saved-recipes/${encodeURIComponent(mealName)}`);
        setSavedRecipes((prev) => prev.filter((r) => (r.recipeName || r.name) !== mealName));
        toast.info("Recipe removed from saved bookmarks.");
      } else {
        const payload = {
          recipeName: mealName,
          recipeNameUrdu: meal.urduName || meal.recipeNameUrdu || "",
          calories: meal.calories || 0,
          protein: meal.protein || 0,
          carbs: meal.carbs || 0,
          fat: meal.fat || 0,
          image: meal.image || "/assets/ingredients.jpeg",
          prepTime: meal.prepTime || "20 mins",
          dietaryType: meal.dietaryType || "Desi",
          ingredients: meal.ingredients || [],
          instructions: meal.instructions || [],
          instructionsUrdu: meal.instructions_ur || meal.instructionsUrdu || "",
        };
        await api.post("/users/save-recipe", payload);
        setSavedRecipes((prev) => [...prev, payload]);
        toast.success(`"${mealName}" saved to your collection!`);
      }
    } catch (e) {
      toast.error("Failed to bookmark recipe.");
    }
  };

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const nameMatch = (r.recipeName || "").toLowerCase().includes(q) || (r.urduName || "").includes(q);
      const ingredientMatch = Array.isArray(r.ingredients)
        ? r.ingredients.some((ing) => {
            const ingText = typeof ing === "object" ? `${ing.englishName || ""} ${ing.urduName || ""}` : String(ing);
            return ingText.toLowerCase().includes(q);
          })
        : false;

      const matchesQuery = !q || nameMatch || ingredientMatch;

      const matchesMeal =
        selectedMealType === "all" ||
        (r.mealType || "").toLowerCase() === selectedMealType.toLowerCase();

      const matchesDiet =
        selectedDietaryType === "all" ||
        (r.dietaryType || "").toLowerCase() === selectedDietaryType.toLowerCase();

      return matchesQuery && matchesMeal && matchesDiet;
    });
  }, [allRecipes, searchTerm, selectedMealType, selectedDietaryType]);

  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage) || 1;
  const paginatedRecipes = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredRecipes.slice(start, start + itemsPerPage);
  }, [filteredRecipes, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-entrance">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100/90 shadow-xl shadow-orange-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-100/40 rounded-full blur-3xl -z-10" />

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-black uppercase tracking-wider">
            <FaUtensils size={11} />
            <span>Pakistani Culinary Database</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 font-headline">
            Explore 650+ Authentic Recipes
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-xl">
            Browse our complete catalog of Pakistani meals with verified macros, bilingual Urdu instructions, and exact ingredients.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-full shadow-md shadow-orange-500/20 transition self-start md:self-auto"
        >
          <FaArrowLeft size={11} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-md space-y-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search Biryani, Karahi, Daal, Paneer, Chana..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full h-11 pl-11 pr-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>

          <span className="text-xs font-bold text-gray-500 self-end md:self-auto">
            Showing <strong className="text-orange-600">{filteredRecipes.length}</strong> of {allRecipes.length || 650}+ dishes
          </span>
        </div>

        {/* Meal Slot Filter */}
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
                setSelectedMealType(m.val);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                selectedMealType === m.val
                  ? "bg-orange-500 text-white shadow-xs"
                  : "bg-gray-100 hover:bg-orange-50 text-gray-600 hover:text-orange-600"
              }`}
            >
              {m.label}
            </button>
          ))}

          <div className="h-4 w-px bg-gray-200 mx-2 self-center hidden sm:block" />

          {/* Dietary Filter */}
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
                setSelectedDietaryType(d.val);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                selectedDietaryType === d.val
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-gray-100 hover:bg-amber-50 text-gray-600 hover:text-amber-600"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-orange-100/80 shadow-md space-y-4 animate-pulse">
              <div className="h-44 bg-gray-100 rounded-2xl w-full" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : paginatedRecipes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm space-y-3">
          <FaUtensils size={36} className="text-orange-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">No matching recipes found</h3>
          <p className="text-xs text-gray-500">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {paginatedRecipes.map((r, idx) => {
            const isSaved = savedRecipes.some((s) => (s.recipeName || s.name) === (r.recipeName || r.name));
            const rImage = r.mealImageURL || r.meal_image_url || r.image || "/assets/ingredients.jpeg";

            return (
              <div
                key={r.id || idx}
                className="bg-white rounded-3xl p-5 border border-orange-100/90 shadow-lg shadow-orange-500/5 flex flex-col justify-between space-y-4 hover:shadow-xl transition duration-300 hover:scale-102"
              >
                <div className="w-full h-44 rounded-2xl overflow-hidden bg-gray-100 relative group">
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
                    <p className="text-[11px] font-bold text-orange-600 truncate" dir="rtl">
                      {r.urduName}
                    </p>
                  )}

                  <div className="flex gap-2 text-[11px] font-bold text-gray-600 pt-1">
                    <span className="text-emerald-700">P: {r.protein}g</span>
                    <span>&bull;</span>
                    <span className="text-amber-700">C: {r.carbs}g</span>
                    <span>&bull;</span>
                    <span className="text-purple-700">F: {r.fat || 0}g</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-orange-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedRecipeModal(r)}
                    className="text-xs font-extrabold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <FaEye size={12} />
                    <span>View Recipe &rarr;</span>
                  </button>
                  <span className="text-[10px] font-bold text-gray-400">
                    ⏱️ {r.prepTime || "20 mins"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            &larr; Prev
          </button>

          <span className="text-xs font-bold text-gray-600 px-3">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Next &rarr;
          </button>
        </div>
      )}

      {/* Centered Popup Recipe Details Modal */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedRecipeModal && (
            <div
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[500] flex items-center justify-center p-3 sm:p-5"
              onClick={() => setSelectedRecipeModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[86vh] flex flex-col overflow-hidden border border-orange-100/90 relative my-auto select-none"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedRecipeModal(null)}
                  className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md hover:bg-orange-50 text-gray-600 hover:text-orange-600 flex items-center justify-center transition shadow-md border border-gray-200/60"
                >
                  <FaTimes size={13} />
                </button>

                {/* Hero Banner with Dish Image */}
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gray-900 shrink-0">
                  <img
                    src={
                      selectedRecipeModal.mealImageURL ||
                      selectedRecipeModal.meal_image_url ||
                      selectedRecipeModal.image ||
                      "/assets/ingredients.jpeg"
                    }
                    alt={selectedRecipeModal.recipeName}
                    className="w-full h-full object-cover opacity-85"
                    onError={(e) => {
                      e.target.src = "/assets/ingredients.jpeg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                  {/* Badges on Hero */}
                  <div className="absolute top-3.5 left-4 flex gap-2 flex-wrap z-10">
                    <span className="bg-orange-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md">
                      {selectedRecipeModal.mealType || "Recipe"}
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
                          {selectedRecipeModal.recipeName}
                        </h3>
                        {selectedRecipeModal.urduName && (
                          <p className="text-xs sm:text-sm font-bold text-orange-400 drop-shadow-sm truncate" dir="rtl">
                            {selectedRecipeModal.urduName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 shrink-0">
                        <FaClock className="text-orange-400" size={11} />
                        <span>{selectedRecipeModal.prepTime || "20 mins"}</span>
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
                      {selectedRecipeModal.fat || 0} <span className="text-[10px] font-bold text-gray-400">g</span>
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
                          Traditional fresh ingredients calibrated in recipe.
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
                  {(selectedRecipeModal.instructions_ur || selectedRecipeModal.instructionsUrdu) && (
                    <div className="space-y-2.5 pt-2 border-t border-orange-100" dir="rtl">
                      <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest text-right">
                        طریقہ کار (Urdu Instructions)
                      </h4>

                      <div className="space-y-2">
                        {Array.isArray(selectedRecipeModal.instructions_ur || selectedRecipeModal.instructionsUrdu) ? (
                          (selectedRecipeModal.instructions_ur || selectedRecipeModal.instructionsUrdu).map(
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
                            {selectedRecipeModal.instructions_ur || selectedRecipeModal.instructionsUrdu}
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
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-orange-600 hover:text-orange-700 bg-white hover:bg-orange-50 px-4 py-2 rounded-full border border-orange-200 transition shadow-2xs"
                  >
                    <FaBookmark size={11} />
                    <span>Bookmark Recipe</span>
                  </button>

                  <button
                    onClick={() => setSelectedRecipeModal(null)}
                    className="bg-gray-900 hover:bg-black text-white font-bold text-xs px-5 py-2 rounded-full transition shadow-xs"
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
