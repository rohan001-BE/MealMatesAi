import axios from "axios";

const baseURL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || "/api")
    : (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_PRODUCTION || "");

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Authorization Header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("meal_mates_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Rewrite legacy endpoints to FastAPI endpoint structures
    let url = config.url || "";
    if (url === "/auth/get-profile") {
      url = "/auth/me";
    } else if (url === "/users/create-user") {
      url = "/auth/signup";
    } else if (url === "/users/google-signup" || url === "/auth/google-login") {
      url = "/auth/google";
    } else if (url === "/users/get-profile") {
      url = "/users/profile";
    } else if (url === "/users/update-profile") {
      url = "/users/profile";
    } else if (url === "/users/delete-user") {
      url = "/users/delete-account";
    } else if (url === "/mealplan/generate") {
      url = "/meal-plans/generate";
    } else if (url === "/mealplan/all") {
      url = "/meal-plans/history";
    } else if (url === "/mealplan/regenerate") {
      url = "/meal-plans/regenerate";
    } else if (url.startsWith("/mealplan/")) {
      url = url.replace("/mealplan/", "/meal-plans/");
    } else if (url === "/custom/ingredient-restriction" || url === "/custom/refresh-meal") {
      url = "/custom-meals/ingredient-search";
    } else if (url === "/custom/calorie-nutrient" || url === "/custom/refresh-meal-calorie-nutrient") {
      url = "/custom-meals/search";
    } else if (url === "/users/get-custom-meals") {
      url = "/custom-meals";
    } else if (url.startsWith("/users/delete-custom-meal/")) {
      const parts = url.split("/");
      const recipeId = parts[parts.length - 1];
      url = `/custom-meals/by-id/${recipeId}`;
    } else if (url === "/groq/chat") {
      url = "/chat";
    } else if (url.startsWith("/groq/conversation/")) {
      const parts = url.split("/");
      const convId = parts[parts.length - 1];
      url = `/chat/conversations/${convId}`;
    } else if (url.startsWith("/groq/history/")) {
      const parts = url.split("/");
      const convId = parts[parts.length - 1];
      url = `/chat/conversations/${convId}`;
    } else if (url.startsWith("/groq/history")) {
      url = url.replace("/groq/history", "/chat/conversations");
    } else if (url === "/feedback/submit") {
      url = "/feedback";
    } else if (url === "/feedback/all") {
      url = "/feedback/all";
    }

    config.url = url;

    // Schema/Payload Translations
    if (config.data && typeof config.data === "object") {
      const data = config.data;
      if (data.noOfDays !== undefined) {
        data.days = Number(data.noOfDays);
        delete data.noOfDays;
      }
      if (data.mealType !== undefined) {
        data.customMealTypes = Array.isArray(data.mealType) ? data.mealType : [data.mealType];
        data.mealsPerDay = data.customMealTypes.length;
        delete data.mealType;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Macro-Nutrient Normalizers
const normalizeRecipe = (recipe) => {
  if (!recipe) return recipe;
  if (!recipe.nutrients) {
    recipe.nutrients = {
      protein: recipe.protein !== undefined ? recipe.protein : 0,
      carbs: recipe.carbs !== undefined ? recipe.carbs : 0,
      fat: recipe.fat !== undefined ? recipe.fat : (recipe.fats !== undefined ? recipe.fats : 0),
      fats: recipe.fat !== undefined ? recipe.fat : (recipe.fats !== undefined ? recipe.fats : 0),
      fiber: recipe.fiber !== undefined ? recipe.fiber : 0,
      sodium: recipe.sodium !== undefined ? recipe.sodium : 0,
      cholesterol: recipe.cholesterol !== undefined ? recipe.cholesterol : 0
    };
  }
  if (recipe.fat === undefined && recipe.fats !== undefined) recipe.fat = recipe.fats;
  if (recipe.fats === undefined && recipe.fat !== undefined) recipe.fats = recipe.fat;
  return recipe;
};

const deepNormalizeRecipes = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (obj.calories !== undefined && obj.protein !== undefined) {
    normalizeRecipe(obj);
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map(deepNormalizeRecipes);
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        obj[key] = deepNormalizeRecipes(obj[key]);
      }
    }
  }
  return obj;
};

// Response Interceptor: Extract JWT and translate data models
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      // 1. Automatically save token if returned
      if (response.data.token && typeof window !== "undefined") {
        localStorage.setItem("meal_mates_token", response.data.token);
      }

      // 2. Normalize recipes structure
      deepNormalizeRecipes(response.data);

      // Check for singular generated/regenerated plan format
      if (response.data.days && !response.data.mealPlan) {
        const normalized = {
          ...response.data,
          mealPlans: response.data.days.map((d) => ({
            day: d.day,
            recipes: d.meals || [],
            totalCalories: d.totalCalories,
            totalProtein: d.totalProtein,
            totalCarbs: d.totalCarbs,
            totalFat: d.totalFat,
            calorieDeviation: d.calorieDeviation,
            optimizationScore: d.optimizationScore,
          })),
        };
        response.data = {
          success: response.data.status === "success" || response.data.success || true,
          mealPlan: normalized,
        };
      }

      // Check for history/all plans list format
      if (Array.isArray(response.data.mealPlans)) {
        response.data.mealPlans = response.data.mealPlans.map((plan) => {
          if (plan.days && !plan.mealPlans) {
            return {
              ...plan,
              mealPlans: plan.days.map((d) => ({
                day: d.day,
                recipes: d.meals || [],
                totalCalories: d.totalCalories,
                totalProtein: d.totalProtein,
                totalCarbs: d.totalCarbs,
                totalFat: d.totalFat,
                calorieDeviation: d.calorieDeviation,
                optimizationScore: d.optimizationScore,
              })),
            };
          }
          return plan;
        });
      }

      // Flatten custom meals details
      if (response.data.meal) {
        response.data = {
          ...response.data,
          ...response.data.meal,
        };
      }

      // Inject chatbot history pagination properties and map id -> _id
      if (response.data.conversations) {
        if (response.data.currentPage === undefined) {
          response.data.currentPage = 1;
          response.data.totalPages = 1;
        }
        if (Array.isArray(response.data.conversations)) {
          response.data.conversations = response.data.conversations.map((conv) => {
            if (conv.id && !conv._id) {
              conv._id = conv.id;
            }
            return conv;
          });
        }
      }

      // Map conversation single object id -> _id
      if (response.data.conversation) {
        const conv = response.data.conversation;
        if (conv && conv.id && !conv._id) {
          conv._id = conv.id;
        }
      }
    }

    return response;
  },
  (error) => {
    if (error.response && error.response.data && error.response.data.detail) {
      error.response.data.message = error.response.data.detail;
    }
    return Promise.reject(error);
  }
);

export const regenerateMealPlan = (data) => {
  return api.post("/meal-plans/regenerate", data);
};

export default api;
