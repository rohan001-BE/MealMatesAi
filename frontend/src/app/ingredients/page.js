"use client";

import React, { useState } from "react";
import { FaSearch, FaStar, FaExternalLinkAlt, FaStore, FaShoppingCart, FaTruck, FaClock } from "react-icons/fa";

const storeConfigs = [
  {
    key: "daraz",
    name: "Daraz Grocery",
    logo: "/assets/daraz.jpg",
    searchEndpoint: "https://www.daraz.pk/catalog/?spm=a2a0e.tm80360391.search.d_go&q=",
    description: "Pakistan's largest online marketplace with extensive grocery and pantry selection.",
    rating: 4.5,
    deliveryTime: "2-3 days",
    minOrder: "Rs. 500",
    categories: ["Fresh Produce", "Pantry Items", "Snacks", "Beverages"],
  },
  {
    key: "carrefour",
    name: "Carrefour Pakistan",
    logo: "/assets/carrefour1.png",
    searchEndpoint: "https://www.carrefour.pk/mafpak/en/v1/search?q=",
    description: "International supermarket chain with top quality fresh groceries and meat.",
    rating: 4.7,
    deliveryTime: "1-2 days",
    minOrder: "Rs. 1000",
    categories: ["Fresh Food", "Organic Items", "Poultry & Meat", "Dairy"],
  },
  {
    key: "metro",
    name: "Metro Online",
    logo: "/assets/metro.jpg",
    searchEndpoint: "https://www.metro-online.pk/search/grocery?searchText=",
    description: "Wholesale grocery shopping and bulk pantry essentials made effortless.",
    rating: 4.4,
    deliveryTime: "2-4 days",
    minOrder: "Rs. 1500",
    categories: ["Bulk Items", "Restaurant Supplies", "Fresh Produce"],
  },
  {
    key: "naheed",
    name: "Naheed.pk",
    logo: "/assets/naheed.jpg",
    searchEndpoint: "https://www.naheed.pk/catalogsearch/result/?q=",
    description: "Your trusted online hypermarket for daily home essentials and imported goods.",
    rating: 4.3,
    deliveryTime: "1-3 days",
    minOrder: "Rs. 800",
    categories: ["Local Products", "Imported Items", "Daily Essentials"],
  },
  {
    key: "imtiaz",
    name: "Imtiaz Super Market",
    logo: "/assets/imtiaz1.png",
    searchEndpoint: "https://imtiaz.com.pk/?s=",
    description: "Pakistan's most popular value-driven retail grocery shopping experience.",
    rating: 4.6,
    deliveryTime: "1-2 days",
    minOrder: "Rs. 1000",
    categories: ["Fresh Food", "Household Items", "Spices & Pulses"],
  },
  {
    key: "alfatah",
    name: "Al-Fatah Gourmet",
    logo: "/assets/fatah.png",
    searchEndpoint: "https://alfatah.pk/search?q=",
    description: "Premium departmental store with gourmet ingredients and fresh foods.",
    rating: 4.5,
    deliveryTime: "1-3 days",
    minOrder: "Rs. 700",
    categories: ["Gourmet Food", "Local Produce", "Daily Essentials"],
  },
];

export default function IngredientsPage() {
  const [storeQuery, setStoreQuery] = useState("");

  const handleStoreSearch = (endpoint) => {
    const url = endpoint + encodeURIComponent(storeQuery || "grocery");
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12 text-gray-800">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
          Online Grocery Directory
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 font-headline">
          Shop Ingredients from Local Stores
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-lg mx-auto">
          Easily order meal plan ingredients directly from trusted Pakistani online supermarkets and retailers.
        </p>
      </div>

      {/* Global Grocery Search Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md max-w-2xl mx-auto space-y-3">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          Search Any Ingredient Across Stores
        </label>
        <div className="relative">
          <input
            type="text"
            value={storeQuery}
            onChange={(e) => setStoreQuery(e.target.value)}
            placeholder="e.g. Chicken breast, Olive oil, Brown rice, Almonds..."
            className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 px-5 py-3.5 text-sm font-medium pr-12"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500">
            <FaSearch size={16} />
          </span>
        </div>
        <p className="text-[11px] text-gray-400">
          Tip: Enter an ingredient above and click &quot;Shop Now&quot; on any store below to search directly!
        </p>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {storeConfigs.map((store) => (
          <div
            key={store.key}
            className="bg-white rounded-3xl border border-orange-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              {/* Store Logo & Title */}
              <div className="flex items-center gap-4">
                <img
                  src={store.logo}
                  alt={store.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-orange-50 shrink-0 shadow-sm"
                  onError={(e) => {
                    e.target.src = "/assets/logo.png";
                  }}
                />
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900 font-headline">
                    {store.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-0.5">
                    <FaStar size={12} />
                    <span>{store.rating}</span>
                    <span className="text-gray-400 font-normal">/ 5.0</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                {store.description}
              </p>

              {/* Delivery & Min Order */}
              <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-50 grid grid-cols-2 gap-2 text-xs font-semibold text-gray-700">
                <div className="flex items-center gap-1.5">
                  <FaTruck className="text-orange-500 shrink-0" />
                  <span>{store.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FaShoppingCart className="text-orange-500 shrink-0" />
                  <span>Min: {store.minOrder}</span>
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-1.5">
                {store.categories.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Shop Button */}
            <button
              onClick={() => handleStoreSearch(store.searchEndpoint)}
              className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-full text-xs shadow-sm hover:shadow-md transition-all"
            >
              <span>{storeQuery ? `Search "${storeQuery}" on ${store.name}` : `Shop on ${store.name}`}</span>
              <FaExternalLinkAlt size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
