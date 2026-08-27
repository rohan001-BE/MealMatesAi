"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  FaArrowRight,
  FaCalculator,
  FaSlidersH,
  FaClock,
  FaAppleAlt,
  FaUtensils,
  FaCheckCircle,
} from "react-icons/fa";

export default function MealPlannerPage() {
  const title = "How & Why We Personalize Your Meal Plan";
  const titleRef = useRef(null);
  const isInView = useInView(titleRef, { once: true, margin: "-50px" });

  const renderAnimatedTitle = () => (
    <span ref={titleRef} className="inline-block">
      {title.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{
            delay: isInView ? 0.02 * i : 0,
            duration: 0.3,
            type: "spring",
            stiffness: 90,
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative py-20 px-6 text-center max-w-4xl mx-auto space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold text-orange-500 font-headline drop-shadow-sm"
        >
          Plan Your Meals
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed"
        >
          Create your personalized, culturally-tailored meal plan in seconds!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-4"
        >
          <Link
            href="/setup-account"
            className="inline-flex items-center gap-3 text-lg font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-full px-10 py-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <span>Continue</span>
            <FaArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      {/* Explanation Section */}
      <section className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-orange-500 text-center font-headline">
          {renderAnimatedTitle()}
        </h2>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl p-7 border border-orange-100 shadow-sm flex items-start gap-4"
          >
            <div className="bg-orange-100 text-orange-500 p-3.5 rounded-2xl shrink-0">
              <FaCalculator size={22} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">1. Calorie Precision</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We calculate your exact Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) based on your age, gender, height, weight, and activity level.
              </p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl p-7 border border-orange-100 shadow-sm flex items-start gap-4"
          >
            <div className="bg-orange-100 text-orange-500 p-3.5 rounded-2xl shrink-0">
              <FaSlidersH size={22} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">2. Dietary Adaptation</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Whether you follow a traditional Desi, Keto, High-Protein, Vegetarian, or Balanced diet, our optimizer selects meals matching your taste and restrictions.
              </p>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-3xl p-7 border border-orange-100 shadow-sm flex items-start gap-4"
          >
            <div className="bg-orange-100 text-orange-500 p-3.5 rounded-2xl shrink-0">
              <FaClock size={22} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">3. Time & Effort Savings</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Never stress over &ldquo;what should I cook today?&rdquo;. Receive structured daily breakfast, lunch, snack, and dinner recipes with prep times and grocery lists.
              </p>
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-3xl p-7 border border-orange-100 shadow-sm flex items-start gap-4"
          >
            <div className="bg-orange-100 text-orange-500 p-3.5 rounded-2xl shrink-0">
              <FaAppleAlt size={22} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">4. Balanced Nutrition</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Every recipe contains scientific macro distributions (Protein, Carbs, Fats) and micronutrient breakdowns so you never miss your fitness goals.
              </p>
            </div>
          </motion.div>
        </div>

        {/* CTA Bottom Banner */}
        <div className="text-center pt-8">
          <Link
            href="/setup-account"
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
          >
            <span>Ready? Start by setting up your profile</span>
            <FaArrowRight size={12} />
          </Link>
        </div>
      </section>
    </div>
  );
}
