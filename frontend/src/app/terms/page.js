"use client";

import React from "react";
import { FaFileSignature } from "react-icons/fa";

export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 animate-entrance px-6 leading-relaxed text-charcoal-text font-medium text-sm">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight font-headline flex items-center justify-center gap-3">
          <FaFileSignature className="text-primary" />
          <span>Terms of Use</span>
        </h1>
        <p className="text-lg text-on-surface-variant font-medium">
          Effective August 2026
        </p>
      </div>

      <div className="bg-white rounded-[28px] p-8 border border-primary/5 shadow-solaris space-y-6">
        <p>
          By using the Meal Mate AI web application, you agree to comply with our metabolic profile configuration terms.
        </p>
        <h3 className="font-extrabold text-lg text-charcoal-text font-headline border-b border-primary/5 pb-2">Medical Disclaimer</h3>
        <p>
          Meal Mate AI is a software application using algorithmic multipliers to recommend diet splits. The generated outputs are for reference guidelines only and do not replace professional nutritionist counseling or medical diagnosis. Always consult clinical practitioners before starting extreme calorie deficit regimes.
        </p>
        <h3 className="font-extrabold text-lg text-charcoal-text font-headline border-b border-primary/5 pb-2">Account Stewardship</h3>
        <p>
          Users are responsible for safeguarding registration tokens. You agree not to exploit API endpoints to disrupt local backend FastAPIs or Firestore resources.
        </p>
      </div>
    </div>
  );
}
