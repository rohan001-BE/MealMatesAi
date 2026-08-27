"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { toast } from "react-toastify";
import useAuthStore from "../../store/authStore";
import { FaArrowLeft, FaArrowRight, FaCalculator } from "react-icons/fa";

export default function Onboarding() {
  const router = useRouter();
  const { fetchUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    height: "",
    weight: "",
    activityLevel: "",
    goal: "",
  });

  const activityOptions = [
    { value: "sedentary", label: "Sedentary", desc: "Little to no exercise, desk job" },
    { value: "light", label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
    { value: "moderate", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
    { value: "active", label: "Very Active", desc: "Hard exercise 6-7 days/week" },
    { value: "very_active", label: "Extra Active", desc: "Physical worker or athlete" },
  ];

  const goalOptions = [
    { value: "weight_loss", label: "Weight Loss", desc: "Create a caloric deficit to burn fat" },
    { value: "maintain", label: "Maintain Weight", desc: "Maintain overall metabolic balance" },
    { value: "weight_gain", label: "Weight Gain", desc: "Create a caloric surplus to build mass" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.gender) {
        toast.error("Please select a gender.");
        return;
      }
      if (!formData.age || Number(formData.age) <= 0) {
        toast.error("Please enter a valid age.");
        return;
      }
    } else if (step === 2) {
      if (!formData.height || Number(formData.height) <= 0) {
        toast.error("Please enter a valid height.");
        return;
      }
      if (!formData.weight || Number(formData.weight) <= 0) {
        toast.error("Please enter a valid weight.");
        return;
      }
    } else if (step === 3) {
      if (!formData.activityLevel) {
        toast.error("Please select an activity level.");
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.goal) {
      toast.error("Please select your goal.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        gender: formData.gender,
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
        activityLevel: formData.activityLevel,
        weightGoal: formData.goal,
      };

      const { data } = await api.put("/users/calories", payload);
      await fetchUser();
      
      // Navigate to results
      if (typeof window !== "undefined") {
        sessionStorage.setItem("onboarding_result_calories", data.dailyCalories);
      }
      router.push("/onboarding/result");
    } catch (error) {
      toast.error(error.response?.data?.message || "Calculation failed.");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = (step / 4) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-warm relative">
      {/* Background illumination circles */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary-fixed-dim filter blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-tertiary-fixed-dim filter blur-[120px] opacity-15"></div>
      </div>

      <main className="relative z-10 w-full max-w-[600px] flex flex-col gap-6">
        {/* Onboarding Header Navigation */}
        <header className="w-full flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <FaArrowLeft size={14} />
          </button>
          <div className="flex-1 mx-6 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-on-surface-variant tracking-wider uppercase whitespace-nowrap">
              Step {step}/4
            </span>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs font-bold text-primary hover:text-orange-600 transition-colors uppercase tracking-widest px-2 py-1"
          >
            Skip
          </button>
        </header>

        {/* Dynamic Steps Panels */}
        <div className="glass-panel rounded-[28px] p-8 md:p-10 flex flex-col items-center shadow-solaris border border-primary/5 min-h-[500px]">
          {/* STEP 1: GENDER & AGE */}
          {step === 1 && (
            <div className="w-full space-y-6 animate-entrance">
              <div className="text-center space-y-2 mb-4">
                <h2 className="text-3xl font-extrabold text-charcoal-text font-headline">Tell us about yourself</h2>
                <p className="text-sm text-on-surface-variant font-medium">
                  We use these details to configure your basal metabolic rates.
                </p>
              </div>

              {/* Gender selects */}
              <div className="grid grid-cols-2 gap-4">
                {["Male", "Female"].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => handleInputChange("gender", gender)}
                    className={`py-6 rounded-2xl border text-center font-bold transition-all ${
                      formData.gender === gender
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-outline-variant/30 bg-surface-warm text-charcoal-text hover:border-primary/20"
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>

              {/* Age input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal-text uppercase tracking-widest">Age (Years)</label>
                <input
                  type="number"
                  placeholder="e.g. 25"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  className="w-full h-14 px-4 bg-surface-warm text-charcoal-text rounded-2xl border border-outline-variant/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>
            </div>
          )}

          {/* STEP 2: HEIGHT & WEIGHT */}
          {step === 2 && (
            <div className="w-full space-y-6 animate-entrance">
              <div className="text-center space-y-2 mb-4">
                <h2 className="text-3xl font-extrabold text-charcoal-text font-headline">Enter Biometrics</h2>
                <p className="text-sm text-on-surface-variant font-medium">
                  Height and weight are key in daily energy expenditure limits.
                </p>
              </div>

              {/* Height input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal-text uppercase tracking-widest">Height (cm)</label>
                <input
                  type="number"
                  placeholder="e.g. 175"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  className="w-full h-14 px-4 bg-surface-warm text-charcoal-text rounded-2xl border border-outline-variant/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>

              {/* Weight input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal-text uppercase tracking-widest">Weight (kg)</label>
                <input
                  type="number"
                  placeholder="e.g. 70"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  className="w-full h-14 px-4 bg-surface-warm text-charcoal-text rounded-2xl border border-outline-variant/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>
            </div>
          )}

          {/* STEP 3: LIFESTYLE ACTIVITY */}
          {step === 3 && (
            <div className="w-full space-y-6 animate-entrance">
              <div className="text-center space-y-2 mb-4">
                <h2 className="text-3xl font-extrabold text-charcoal-text font-headline">Activity Level</h2>
                <p className="text-sm text-on-surface-variant font-medium">
                  Select your exercise habits to refine target multipliers.
                </p>
              </div>

              <div className="space-y-3">
                {activityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleInputChange("activityLevel", opt.value)}
                    className={`w-full p-4 rounded-2xl border text-left flex flex-col transition-all ${
                      formData.activityLevel === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-outline-variant/20 bg-surface-warm text-charcoal-text hover:border-primary/20"
                    }`}
                  >
                    <span className="font-bold text-sm">{opt.label}</span>
                    <span className="text-xs text-on-surface-variant mt-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: GOAL TARGETS */}
          {step === 4 && (
            <div className="w-full space-y-6 animate-entrance">
              <div className="text-center space-y-2 mb-4">
                <h2 className="text-3xl font-extrabold text-charcoal-text font-headline">Fitness Goal</h2>
                <p className="text-sm text-on-surface-variant font-medium">
                  We will calibrate caloric boundaries to match this target.
                </p>
              </div>

              <div className="space-y-3">
                {goalOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleInputChange("goal", opt.value)}
                    className={`w-full p-4 rounded-2xl border text-left flex flex-col transition-all ${
                      formData.goal === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-outline-variant/20 bg-surface-warm text-charcoal-text hover:border-primary/20"
                    }`}
                  >
                    <span className="font-bold text-sm">{opt.label}</span>
                    <span className="text-xs text-on-surface-variant mt-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="w-full mt-auto pt-8">
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full h-14 bg-primary hover:bg-orange-600 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <span>Continue</span>
                <FaArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end hover:from-orange-600 hover:to-amber-600 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <span>{loading ? "Calculating..." : "Calculate Calories"}</span>
                <FaCalculator size={14} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
