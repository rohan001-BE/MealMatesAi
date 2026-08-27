"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../lib/api";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";
import {
  FaHeartbeat,
  FaEdit,
  FaFire,
  FaWeight,
  FaRulerVertical,
  FaBirthdayCake,
  FaVenusMars,
  FaRunning,
  FaBullseye,
} from "react-icons/fa";

export default function PhysicalStatsPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/users/physical-stats");
        setStats(data.stats || data.userProfile || data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const height = stats?.height || user?.height || 170;
  const weight = stats?.weight || user?.weight || 65;
  const age = stats?.age || user?.age || 25;
  const gender = stats?.gender || user?.gender || "Male";
  const activityLevel = stats?.activityLevel || user?.activityLevel || "moderate";
  const weightGoal = stats?.weightGoal || user?.weightGoal || "weight_loss";
  const dailyCalories = stats?.dailyCalories || user?.dailyCalories || 2000;

  const heightM = height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);

  const getBmiCategory = (val) => {
    const num = parseFloat(val);
    if (num < 18.5) return { label: "Underweight", color: "text-amber-500 bg-amber-50" };
    if (num < 25) return { label: "Normal Weight", color: "text-emerald-500 bg-emerald-50" };
    if (num < 30) return { label: "Overweight", color: "text-orange-500 bg-orange-50" };
    return { label: "Obese", color: "text-red-500 bg-red-50" };
  };

  const bmiCat = getBmiCategory(bmi);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10 text-gray-800">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block mb-1">
            Biometric Profile & Vitals
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
            Physical Stats
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review your body metrics, Body Mass Index (BMI), and metabolic targets.
          </p>
        </div>

        <Link
          href="/update-profile"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-full px-6 py-3 shadow-md transition-all self-start sm:self-auto"
        >
          <FaEdit size={13} />
          <span>Update Metrics</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Metrics Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md space-y-6">
            <h3 className="text-xl font-bold text-gray-900 font-headline flex items-center gap-2">
              <FaHeartbeat className="text-orange-500" />
              <span>Biometric Indicators</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <FaRulerVertical className="text-orange-500" /> Height
                </span>
                <p className="text-2xl font-black text-gray-900 mt-1">{height} cm</p>
              </div>

              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <FaWeight className="text-orange-500" /> Weight
                </span>
                <p className="text-2xl font-black text-gray-900 mt-1">{weight} kg</p>
              </div>

              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <FaBirthdayCake className="text-orange-500" /> Age
                </span>
                <p className="text-2xl font-black text-gray-900 mt-1">{age} Yrs</p>
              </div>

              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <FaVenusMars className="text-orange-500" /> Gender
                </span>
                <p className="text-2xl font-black text-gray-900 mt-1 capitalize">{gender}</p>
              </div>

              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <FaRunning className="text-orange-500" /> Activity
                </span>
                <p className="text-lg font-black text-gray-900 mt-1 capitalize">
                  {activityLevel.replace("_", " ")}
                </p>
              </div>

              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <FaBullseye className="text-orange-500" /> Goal
                </span>
                <p className="text-lg font-black text-gray-900 mt-1 capitalize">
                  {weightGoal.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Energy Target Card */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Calibrated Daily Intake</span>
              <h4 className="text-4xl font-extrabold font-headline mt-1">{dailyCalories} kcal / day</h4>
              <p className="text-xs text-white/80 mt-1 font-medium">
                Scientific TDEE adjusted for your {weightGoal.replace("_", " ")} objective.
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <FaFire size={30} />
            </div>
          </div>
        </div>

        {/* Right Column: BMI Gauge */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-8 border border-orange-100 shadow-md flex flex-col justify-between text-center space-y-6">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Body Mass Index (BMI)
            </span>
            <div className="my-6">
              <span className="text-6xl font-black text-orange-500 font-headline leading-none">{bmi}</span>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mt-3 ${bmiCat.color}`}>
                {bmiCat.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              A normal BMI ranges from 18.5 to 24.9 kg/m². Our meal planning optimizer continuously aligns recipes to help you reach and sustain optimal body composition.
            </p>
          </div>

          <Link
            href="/update-profile"
            className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 py-3 rounded-full text-xs font-bold transition text-center"
          >
            Edit Physical Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
