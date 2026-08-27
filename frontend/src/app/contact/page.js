"use client";

import React, { useState } from "react";
import api from "../../lib/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaPaperPlane,
  FaCheckCircle,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    feedback: "",
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim() || !formData.feedback.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/feedback/submit", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        message: formData.feedback.trim(),
      });
      setIsSubmitted(true);
      toast.success("Message sent successfully!");
      setFormData({ username: "", email: "", feedback: "" });
      setTimeout(() => setIsSubmitted(false), 4000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12 text-gray-800">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
          Get in Touch
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 font-headline">
          We&apos;d Love to Hear From You
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-lg mx-auto">
          Have questions about meal plans, nutrition calculation, or technical support? Drop us a message below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Info Side */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-gray-900 font-headline">Contact Information</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <FaEnvelope size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Email Us</p>
                  <a href="mailto:info@mealmates.com" className="text-sm font-semibold text-gray-800 hover:text-orange-500 transition">
                    info@mealmates.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <FaPhone size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Call / WhatsApp</p>
                  <p className="text-sm font-semibold text-gray-800">+923435559340</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <FaMapMarkerAlt size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Headquarters</p>
                  <p className="text-sm font-semibold text-gray-800 capitalize">Solvxa Rawalpindi Punjab, Pakistan</p>
                </div>
              </div>
            </div>

            <hr className="border-orange-100 my-4" />

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Connect on Socials</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition">
                  <FaFacebook size={16} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition">
                  <FaInstagram size={16} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition">
                  <FaTwitter size={16} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition">
                  <FaWhatsapp size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md">
            <h3 className="text-xl font-bold text-gray-900 font-headline mb-6">Send Us a Message</h3>

            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Your Name <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="e.g. Ali Ahmed"
                      className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 px-4 py-3 text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Email Address <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. ali@example.com"
                      className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 px-4 py-3 text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Message / Inquiry <span className="text-orange-500">*</span>
                    </label>
                    <textarea
                      name="feedback"
                      value={formData.feedback}
                      onChange={handleChange}
                      placeholder="How can we assist your nutrition journey?"
                      rows={5}
                      maxLength={300}
                      className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 px-4 py-3 text-sm font-medium resize-none"
                      required
                    />
                    <p className="text-[11px] text-gray-400 text-right">{formData.feedback.length}/300</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <FaPaperPlane size={13} />
                    )}
                    <span>{loading ? "Sending..." : "Submit Message"}</span>
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center space-y-3"
                >
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <FaCheckCircle size={32} />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 font-headline">Thank You!</h4>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    Your message has been received. Our team will get back to you shortly.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
