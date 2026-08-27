"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaCheckCircle,
  FaUtensils,
  FaArrowRight,
  FaCalculator,
  FaCalendarAlt,
  FaShoppingCart,
  FaRobot,
} from "react-icons/fa";

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-16 text-gray-800">
      {/* Title */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
          Intelligent Automation
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-orange-500 font-headline">
          How We Automate Your Meal Planning
        </h1>
        <p className="text-xl text-gray-600 italic">
          (And put you in complete control of your diet!)
        </p>
        <div className="w-20 h-1 bg-orange-500 mx-auto rounded-full mt-2" />
      </div>

      {/* Benefits List */}
      <div className="bg-white rounded-3xl p-8 border border-orange-100 shadow-sm max-w-4xl mx-auto">
        <ul className="space-y-4 text-base sm:text-lg text-gray-700">
          {[
            "Turn daily meal planning into an effortless, delightful experience",
            "Access a personalized database of 500+ healthy, delicious Pakistani recipes",
            "Get auto-generated meal schedules tailored to your exact calories and macro goals",
            "Save time and money with integrated grocery store shopping links",
            "No tedious manual calorie counting — our AI model calculates it all for you",
          ].map((benefit, i) => (
            <li key={i} className="flex items-start gap-3">
              <FaCheckCircle className="text-orange-500 shrink-0 mt-1" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Stats Section */}
      <div className="text-center space-y-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
          People Love Meal Mates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-orange-100 p-8 rounded-3xl shadow-sm flex flex-col items-center">
            <FaCheckCircle className="text-4xl text-emerald-500 mb-3" />
            <p className="text-3xl font-black text-gray-900">12,000+</p>
            <p className="text-sm font-semibold text-gray-500 mt-1">Happy Planners</p>
          </div>
          <div className="bg-white border border-orange-100 p-8 rounded-3xl shadow-sm flex flex-col items-center">
            <FaUtensils className="text-4xl text-orange-500 mb-3" />
            <p className="text-3xl font-black text-gray-900">48,000+</p>
            <p className="text-sm font-semibold text-gray-500 mt-1">Meals Generated</p>
          </div>
          <div className="bg-white border border-orange-100 p-8 rounded-3xl shadow-sm flex flex-col items-center">
            <FaChartLine className="text-4xl text-blue-500 mb-3" />
            <p className="text-3xl font-black text-gray-900">98.4%</p>
            <p className="text-sm font-semibold text-gray-500 mt-1">Macro Accuracy</p>
          </div>
        </div>
      </div>

      {/* Did You Know Box */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-8 sm:p-10 text-white shadow-xl text-center sm:text-left flex flex-col sm:flex-row items-center gap-8">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl shrink-0">
          💡
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold uppercase tracking-wide">
            Did You Know?
          </h3>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed font-medium">
            Meal Mate AI has cataloged over <strong className="text-white underline">500+ Pakistani and South Asian recipes</strong> with verified macro splits. Every recipe is tagged with local Urdu ingredient names, prep times, and dietary styles so you never eat boring food!
          </p>
        </div>
      </div>

      {/* 5-Step Guide */}
      <div className="space-y-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-orange-500 text-center font-headline">
          Get Started In 5 Easy Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "1. Calculate Calories",
              desc: "Enter your age, weight, height, and activity level. We calculate your exact BMR and TDEE needs.",
            },
            {
              step: "02",
              title: "2. Choose Preferences",
              desc: "Pick your dietary style (Desi, Keto, High-Protein, Balanced) and daily meal slot schedules.",
            },
            {
              step: "03",
              title: "3. Auto-Generate Plan",
              desc: "Our optimization algorithm builds 1 to 14 days of balanced, allergy-free meals with one click.",
            },
            {
              step: "04",
              title: "4. Shop Ingredients",
              desc: "Don't like a meal? Swap it instantly. Then order ingredients directly from Daraz, Metro, or Carrefour.",
            },
            {
              step: "05",
              title: "5. Chat with AI Nutritionist",
              desc: "Ask our Groq-powered AI questions in English or Roman Urdu for real-time food advice and guidance.",
            },
            {
              step: "06",
              title: "6. Track Progress",
              desc: "Check off meals on your dashboard and view your streak counter and nutritional achievements grow.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-3xl p-7 border border-orange-100 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div className="space-y-2">
                <span className="text-3xl font-black text-orange-500 font-headline">
                  {item.step}
                </span>
                <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Bottom Banner */}
      <div className="text-center bg-white rounded-3xl p-10 border border-orange-100 shadow-md space-y-6">
        <h3 className="text-3xl font-extrabold text-gray-900 font-headline">
          Ready to experience effortless meal planning?
        </h3>
        <p className="text-gray-500 max-w-md mx-auto text-sm">
          Get your AI-calibrated meal schedule in less than 2 minutes.
        </p>
        <Link
          href="/meal-planner"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-base rounded-full px-10 py-4 shadow-md hover:shadow-xl transition-all"
        >
          <span>Start Planning Now</span>
          <FaArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
