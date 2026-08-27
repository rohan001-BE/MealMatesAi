"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaArrowRight,
  FaRobot,
  FaLeaf,
  FaFire,
  FaUsers,
  FaUserMd,
  FaLaptopCode,
} from "react-icons/fa";

const teamMembers = [
  {
    name: "Rohan Bin Ejaz",
    role: "Founder & AI Engineer",
    bio: "Leading machine learning model optimization, dietary combinatorial algorithms, and AI systems tailored for Pakistani culinary living.",
    avatar: "/assets/Founder.png",
    icon: <FaLaptopCode className="text-orange-500" />,
  },
  {
    name: "Clinical Nutrition & Medical Advisory",
    role: "Dietary Consultant & Medical Advisory",
    bio: "Certified clinical consultants and dietitians validating scientific calorie bounds, BMR multipliers, and nutritional accuracy.",
    avatar: "/assets/DOC.jpg",
    icon: <FaUserMd className="text-emerald-500" />,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf5ef] text-gray-800">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-amber-50/50 to-orange-100/30 border-b border-orange-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
              Our Story & Vision
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 font-headline leading-tight">
              Built to Transform <br />
              <span className="text-orange-500">Pakistani Nutrition</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Meal Mate AI was born from a simple frustration — most international nutrition apps don&apos;t understand Pakistani cuisine, local staples, or cultural eating habits. We built an intelligent platform that finally speaks your language and understands your food.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-orange-100 bg-orange-50/50 p-2">
              <img
                src="/assets/Home.png"
                alt="Our Mission with Meal Mate AI"
                className="rounded-2xl w-full h-[380px] object-contain transition-transform duration-300 hover:scale-[1.02]"
                onError={(e) => {
                  e.target.src = "/assets/home.png";
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
                What Drives Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
                Our Mission
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              We believe every person deserves access to intelligent, culturally-aware nutrition advice. Our machine learning models are custom-trained on South Asian and Pakistani food databases, making daily meal recommendations that are realistic, healthy, and delicious.
            </p>
            <ul className="space-y-3">
              {[
                "AI-powered personalized 1-14 day meal planning",
                "Verified database of 500+ Pakistani and Desi recipes",
                "Conversational Roman Urdu & English nutrition chatbot",
                "Direct integrations with local grocery stores (Daraz, Metro, Carrefour)",
                "Scientific BMR and TDEE calorie calibration",
                "Accurate macro splits (Protein, Carbs, Healthy Fats)",
              ].map((pt) => (
                <li key={pt} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                  <FaCheckCircle className="text-orange-500 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#faf5ef] border-y border-orange-100">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Active Planners", value: "12,000+", icon: <FaUsers className="text-orange-500" /> },
            { label: "Meals Generated", value: "48,000+", icon: <FaFire className="text-orange-500" /> },
            { label: "Pakistani Recipes", value: "500+", icon: <FaLeaf className="text-emerald-500" /> },
            { label: "AI Consultations", value: "90,000+", icon: <FaRobot className="text-purple-500" /> },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100"
            >
              <div className="text-2xl mb-2 flex justify-center">{s.icon}</div>
              <p className="text-3xl font-black text-gray-900 font-headline">{s.value}</p>
              <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team / Leadership Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
              Leadership & Expertise
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
              Meet the Founder & Advisory Team
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
              The technologists and health specialists building the future of Pakistani nutrition intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teamMembers.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-[#faf5ef] rounded-3xl p-8 flex flex-col items-center text-center border border-orange-100 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-orange-300 shadow-md"
                    onError={(e) => {
                      e.target.src = "/assets/default-profile.png";
                    }}
                  />
                  <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow border border-orange-100">
                    {member.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-headline">{member.name}</h3>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mt-0.5">
                    {member.role}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Meal Mate AI Section */}
      <section className="py-20 bg-[#faf5ef] border-t border-orange-100">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 order-2 lg:order-1"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
                Authentic & Practical
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
                Why Meal Mate AI?
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Most nutrition apps force you to eat plain salads or Western meals that don&apos;t match our culture. Meal Mate AI understands Biryani, Daal Roti, Karahi, and Haleem — keeping you on track with your fitness goals without sacrificing the foods you love.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Our platform combines machine-learning meal optimization, precise macro calculations, bilingual Roman Urdu AI assistance, and seamless grocery store links to make healthy living enjoyable and sustainable.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/meal-planner"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-full px-8 py-3.5 transition-all shadow-md"
              >
                <span>Start Meal Plan</span>
                <FaArrowRight size={12} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-orange-200 bg-white text-gray-800 hover:border-orange-400 hover:text-orange-500 font-bold rounded-full px-8 py-3.5 transition-all shadow-sm"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-orange-100 bg-white p-2">
              <img
                src="/assets/introduction.jpeg"
                alt="Platform Introduction"
                className="rounded-2xl w-full h-[360px] object-cover"
                onError={(e) => {
                  e.target.src = "/assets/Home.png";
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center">
        <div className="max-w-2xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-headline leading-tight">
            Join Thousands Eating Smarter
          </h2>
          <p className="text-white/90 text-sm sm:text-base">
            Get your AI-calibrated personalized meal schedule tailored for Pakistani foods today.
          </p>
          <Link
            href="/meal-planner"
            className="inline-flex items-center gap-2 bg-white text-orange-500 font-extrabold rounded-full px-10 py-4 shadow-2xl hover:-translate-y-0.5 transition-all"
          >
            <span>Create Your Meal Plan</span>
            <FaArrowRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}
