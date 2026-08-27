import { create } from "zustand";

const useWizardStore = create((set) => ({
  weightGoal: "weight_loss",
  dietaryType: "balanced",
  mealType: ["Breakfast", "Lunch", "Dinner"],
  noOfDays: 3,
  dailyCalories: 2000,
  latestGeneratedPlan: null,

  setWeightGoal: (weightGoal) => set({ weightGoal }),
  setDietaryType: (dietaryType) => set({ dietaryType }),
  setMealType: (mealType) => set({ mealType }),
  setNoOfDays: (noOfDays) => set({ noOfDays }),
  setDailyCalories: (dailyCalories) => set({ dailyCalories }),
  setLatestGeneratedPlan: (latestGeneratedPlan) => set({ latestGeneratedPlan }),

  resetWizard: () => set({
    weightGoal: "weight_loss",
    dietaryType: "balanced",
    mealType: ["Breakfast", "Lunch", "Dinner"],
    noOfDays: 3,
    dailyCalories: 2000,
    latestGeneratedPlan: null,
  })
}));

export default useWizardStore;
