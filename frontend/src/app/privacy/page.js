"use client";

import React from "react";
import { FaShieldAlt } from "react-icons/fa";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 animate-entrance px-6 leading-relaxed text-charcoal-text font-medium text-sm">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight font-headline flex items-center justify-center gap-3">
          <FaShieldAlt className="text-primary" />
          <span>Privacy Policy</span>
        </h1>
        <p className="text-lg text-on-surface-variant font-medium">
          Effective August 2026
        </p>
      </div>

      <div className="bg-white rounded-[28px] p-8 border border-primary/5 shadow-solaris space-y-6">
        <p>
          At Meal Mate AI, we respect your privacy and protect all biometrics and dietary information collected from you. This document details how we collect, process, and safeguard your credentials.
        </p>
        <h3 className="font-extrabold text-lg text-charcoal-text font-headline border-b border-primary/5 pb-2">Information We Collect</h3>
        <p>
          We collect account registration data (username, email) alongside physiological indexes (weight, height, age, gender) to run calorie target multipliers. Meal history records are securely saved inside encrypted Firestore collections.
        </p>
        <h3 className="font-extrabold text-lg text-charcoal-text font-headline border-b border-primary/5 pb-2">Data Protection</h3>
        <p>
          All data transmission happens over secure channels (HTTPS) with tokens signed via firebase web interfaces. We do not sell or share user profiles with third-party advertising companies.
        </p>
      </div>
    </div>
  );
}
