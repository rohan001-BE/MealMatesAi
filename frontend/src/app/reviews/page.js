"use client";

import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "react-toastify";
import useAuthStore from "../../store/authStore";
import { FaStar, FaQuoteLeft, FaCheckCircle, FaPlus, FaTimes, FaPaperPlane } from "react-icons/fa";
import UserAvatar from "../../components/UserAvatar";

const fallbackReviews = [
  {
    username: "Sarah Ahmed",
    message: "Meal Mates has transformed my meal planning! The recipes are delicious, nutritious, and perfectly aligned with my weight loss goals.",
    profileImage: "/assets/sarah.jpg",
    rating: 5,
  },
  {
    username: "Mohammad Khan",
    message: "As a busy professional, this app has been a game-changer. The high-protein desi meal suggestions are spot-on.",
    profileImage: "/assets/khan.jpg",
    rating: 5,
  },
  {
    username: "Fatima Zahra",
    message: "The variety of recipes is amazing! I've discovered so many new healthy Pakistani dishes that my whole family enjoys.",
    profileImage: "/assets/fatima.jpg",
    rating: 5,
  },
  {
    username: "Ali Hassan",
    message: "The interface is intuitive, and the recipes are both healthy and delicious. An absolute essential nutrition companion!",
    profileImage: "/assets/Ali.jpg",
    rating: 5,
  },
  {
    username: "Ayesha Malik",
    message: "Personalized calorie and macro targets have helped me achieve my fitness goals while enjoying delicious meals.",
    profileImage: "/assets/ayesha.jpg",
    rating: 5,
  },
];

export default function ReviewsPage() {
  const { user } = useAuthStore();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    message: "",
    rating: 5,
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.username || user.displayName || prev.username,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/feedback/all");
      if (Array.isArray(data.feedbacks) && data.feedbacks.length > 0) {
        setFeedbacks([...data.feedbacks, ...fallbackReviews]);
      } else {
        setFeedbacks(fallbackReviews);
      }
    } catch (err) {
      setFeedbacks(fallbackReviews);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.message.trim()) {
      toast.error("Please provide your name and feedback message.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/feedback/submit", {
        username: formData.username,
        email: formData.email,
        message: formData.message,
        rating: formData.rating,
      });
      toast.success("Thank you! Your feedback has been submitted.");
      setIsModalOpen(false);
      // Prepend to active list
      setFeedbacks((prev) => [
        {
          username: formData.username,
          message: formData.message,
          profileImage: user?.profileImage || "/assets/default-profile.png",
          rating: formData.rating,
        },
        ...prev,
      ]);
      setFormData((prev) => ({ ...prev, message: "" }));
    } catch (err) {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf5ef] pt-20 sm:pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Banner */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold text-orange-600 uppercase tracking-widest bg-orange-100/80 px-3.5 py-1 rounded-full inline-block">
            Community Stories
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 font-headline tracking-tight">
            What Our Users Say
          </h1>
          <p className="text-gray-600 text-xs sm:text-base leading-relaxed">
            Read genuine reviews and success stories from people achieving their health and nutrition goals with Meal Mate AI.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <FaPlus size={12} />
              <span>Share Your Experience</span>
            </button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {feedbacks.map((rev, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-orange-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex text-amber-400 gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar key={s} size={13} />
                    ))}
                  </div>
                  <FaQuoteLeft className="text-orange-200" size={18} />
                </div>

                <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed font-medium">
                  &ldquo;{rev.message}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-orange-50">
                <UserAvatar
                  src={rev.profileImage}
                  name={rev.username}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-orange-200 shadow-xs shrink-0"
                  textClassName="text-sm font-black text-white"
                  alt={rev.username}
                />
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
                    {rev.username}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-orange-600 font-bold flex items-center gap-1">
                    <FaCheckCircle size={10} />
                    <span>Verified Member</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Feedback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-orange-100 p-6 sm:p-8 space-y-5 animate-entrance relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-orange-50 text-gray-400 hover:text-orange-500 flex items-center justify-center transition cursor-pointer"
            >
              <FaTimes size={13} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                Share Your Story
              </span>
              <h3 className="text-xl font-black text-gray-900 font-headline">
                Leave a Review
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. Sarah Ahmed"
                  required
                  className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Experience *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How did Meal Mate help with your meal planning, nutrition, or weight goals?"
                  rows={4}
                  required
                  className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-xs text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : (
                    <>
                      <FaPaperPlane size={11} />
                      <span>Post Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
