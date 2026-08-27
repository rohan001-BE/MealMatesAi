/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/mealplan/generate",
        destination: "http://localhost:8000/api/meal-plans/generate",
      },
      {
        source: "/mealplan/all",
        destination: "http://localhost:8000/api/meal-plans/history",
      },
      {
        source: "/mealplan/regenerate",
        destination: "http://localhost:8000/api/meal-plans/regenerate",
      },
      {
        source: "/custom/ingredient-restriction",
        destination: "http://localhost:8000/api/custom-meals/ingredient-search",
      },
      {
        source: "/custom/refresh-meal",
        destination: "http://localhost:8000/api/custom-meals/ingredient-search",
      },
      {
        source: "/custom/calorie-nutrient",
        destination: "http://localhost:8000/api/custom-meals/search",
      },
      {
        source: "/custom/refresh-meal-calorie-nutrient",
        destination: "http://localhost:8000/api/custom-meals/search",
      },
      {
        source: "/groq/chat",
        destination: "http://localhost:8000/api/chat",
      },
      {
        source: "/groq/conversation/:id*",
        destination: "http://localhost:8000/api/chat/conversations/:id*",
      },
      {
        source: "/groq/history/:path*",
        destination: "http://localhost:8000/api/chat/conversations/:path*",
      },
      {
        source: "/groq/history",
        destination: "http://localhost:8000/api/chat/conversations",
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      {
        source: "/auth/:path*",
        destination: "http://localhost:8000/api/auth/:path*",
      },
      {
        source: "/users/:path*",
        destination: "http://localhost:8000/api/users/:path*",
      },
      {
        source: "/feedback/:path*",
        destination: "http://localhost:8000/api/feedback/:path*",
      },
      {
        source: "/recipes/:path*",
        destination: "http://localhost:8000/api/recipes/:path*",
      },
      {
        source: "/custom/:path*",
        destination: "http://localhost:8000/api/custom-meals/:path*",
      },
      {
        source: "/groq/:path*",
        destination: "http://localhost:8000/api/chat/:path*",
      },
    ];
  },
};

export default nextConfig;
