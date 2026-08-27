"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaQuestionCircle, FaChevronDown, FaChevronUp, FaHeadset, FaBookOpen, FaUtensils, FaArrowRight } from "react-icons/fa";

export default function HelpPage() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: "How does Meal Mate calculate my daily calorie target?",
      a: "We use the Mifflin-St Jeor and Harris-Benedict formulas to evaluate your exact Basal Metabolic Rate (BMR), then multiply it by your physical activity factor to determine your Total Daily Energy Expenditure (TDEE). If your goal is weight loss, a 500 kcal deficit is applied; for bulking, a 500 kcal surplus is added.",
    },
    {
      q: "Are the recipes optimized for traditional Pakistani foods?",
      a: "Yes! Unlike Western apps, our machine learning models and recipe databases are custom-trained on Pakistani and South Asian cuisine. From Daal Roti, Karahi Chicken, Biryani, to regional vegetables, we calculate real macros for the foods you actually cook and eat.",
    },
    {
      q: "Can I talk to the AI Nutritionist in Roman Urdu?",
      a: "Absolutely. Our AI nutritionist understands English, Urdu, and Roman Urdu (e.g. 'biryani me kitni calories hain?'). It gives contextual meal advice, portion guidelines, and ingredient swaps.",
    },
    {
      q: "How do I save custom recipes or ingredient searches?",
      a: "When you search by ingredient or calorie target under the 'Custom' menu, matching recipes are automatically saved to your profile's Custom Recipes tab. You can access and view them anytime.",
    },
    {
      q: "How can I order ingredients from Pakistani online supermarkets?",
      a: "Visit the 'Store' tab to search any ingredient across Daraz Grocery, Carrefour Pakistan, Metro Online, Naheed, Imtiaz Super Market, and Al-Fatah. One click takes you directly to their online checkout.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10 text-gray-800">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
          Support & Guidance
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 font-headline">
          Help Center & FAQs
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-lg mx-auto">
          Find answers to common questions about meal planning, nutrition formulas, and AI consulting.
        </p>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <FaBookOpen size={20} />
          </div>
          <h4 className="font-extrabold text-base text-gray-900">How It Works</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Understand how our AI algorithms calculate calories and optimize weekly meals.
          </p>
          <Link href="/how-it-works" className="text-xs font-bold text-orange-500 hover:text-orange-600 block pt-1">
            Read Guide &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <FaUtensils size={20} />
          </div>
          <h4 className="font-extrabold text-base text-gray-900">Meal Planner</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Generate a personalized multi-day nutrition schedule in under 2 minutes.
          </p>
          <Link href="/meal-planner" className="text-xs font-bold text-orange-500 hover:text-orange-600 block pt-1">
            Start Planner &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <FaHeadset size={20} />
          </div>
          <h4 className="font-extrabold text-base text-gray-900">Contact Support</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Need customized help or technical assistance? Send our team a message.
          </p>
          <Link href="/contact" className="text-xs font-bold text-orange-500 hover:text-orange-600 block pt-1">
            Contact Us &rarr;
          </Link>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md space-y-6">
        <h3 className="text-xl font-bold text-gray-900 font-headline flex items-center gap-2">
          <FaQuestionCircle className="text-orange-500" />
          <span>Frequently Asked Questions</span>
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-orange-100 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center text-left p-4 sm:p-5 bg-orange-50/40 hover:bg-orange-50 font-bold text-sm text-gray-800 transition"
                >
                  <span className="pr-4">{faq.q}</span>
                  {isOpen ? (
                    <FaChevronUp size={12} className="text-orange-500 shrink-0" />
                  ) : (
                    <FaChevronDown size={12} className="text-orange-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 sm:p-5 bg-white border-t border-orange-100 text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
