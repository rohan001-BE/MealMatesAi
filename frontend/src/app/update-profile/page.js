"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { toast } from "react-toastify";
import useAuthStore from "../../store/authStore";
import {
  FaUser,
  FaSave,
  FaTrashAlt,
  FaCamera,
  FaTimesCircle,
  FaShieldAlt,
  FaHeartbeat,
  FaCheck,
} from "react-icons/fa";

export default function UpdateProfilePage() {
  const router = useRouter();
  const {
    user,
    profileImage,
    uploadProfileImage,
    deleteProfileImage,
    deleteUser,
    fetchUser,
    setUser,
  } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);

  const [profileForm, setProfileForm] = useState({
    username: "",
    gender: "Male",
    age: "25",
    height: "170",
    weight: "70",
    activityLevel: "moderate",
    weightGoal: "weight_loss",
    dietaryType: "desi",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || "",
        gender: user.gender || "Male",
        age: String(user.age || "25"),
        height: String(user.height || "170"),
        weight: String(user.weight || "70"),
        activityLevel: user.activityLevel || "moderate",
        weightGoal: user.weightGoal || "weight_loss",
        dietaryType: user.dietaryType || "desi",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        username: profileForm.username.trim(),
        gender: profileForm.gender,
        age: Number(profileForm.age),
        height: Number(profileForm.height),
        weight: Number(profileForm.weight),
        activityLevel: profileForm.activityLevel,
        weightGoal: profileForm.weightGoal,
        dietaryType: profileForm.dietaryType,
      };

      const { data } = await api.put("/users/profile", payload);
      if (data?.updatedProfile) {
        setUser(data.updatedProfile);
      } else {
        await fetchUser();
      }
      toast.success("Profile details updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    setUploading(true);
    try {
      await uploadProfileImage(file);
      await fetchUser();
      toast.success("Profile photo updated on Cloudinary!");
    } catch (err) {
      toast.error("Failed to upload profile photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!window.confirm("Remove profile photo?")) return;
    try {
      await deleteProfileImage();
      await fetchUser();
      toast.success("Profile photo removed.");
    } catch (err) {
      toast.error("Failed to remove profile photo.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUser();
      toast.success("Account permanently deleted.");
      router.push("/login");
    } catch (err) {
      toast.error("Failed to delete account.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10 text-gray-800">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block mb-1">
            Account Management
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-headline">
            Account Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal profile, Cloudinary avatar, and biometric constraints.
          </p>
        </div>
      </div>

      {/* Avatar Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <img
            src={user?.profileImage || profileImage || "/assets/default-profile.png"}
            alt={user?.username || "Profile"}
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-200 shadow-md"
            onError={(e) => {
              e.target.src = "/assets/default-profile.png";
            }}
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <label
            htmlFor="avatarInput"
            className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full cursor-pointer shadow-md transition"
            title="Upload new picture"
          >
            <FaCamera size={12} />
          </label>
          <input
            id="avatarInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={uploading}
          />
        </div>

        <div className="space-y-1.5 text-center sm:text-left flex-1">
          <h3 className="text-xl font-bold text-gray-900 font-headline">
            {user?.username || "User"}
          </h3>
          <p className="text-xs text-gray-500">{user?.email}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
            <label
              htmlFor="avatarInput"
              className="cursor-pointer text-xs font-bold text-orange-500 hover:text-orange-600 bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-200 transition"
            >
              Upload Photo
            </label>
            {user?.profileImage && (
              <button
                onClick={handleAvatarDelete}
                className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 px-3.5 py-1.5 rounded-full border border-red-100 transition"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md space-y-8">
        <h3 className="text-xl font-bold text-gray-900 font-headline flex items-center gap-2">
          <FaUser className="text-orange-500" />
          <span>Profile & Biometric Settings</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Username</label>
            <input
              type="text"
              name="username"
              value={profileForm.username}
              onChange={handleChange}
              className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Gender</label>
            <select
              name="gender"
              value={profileForm.gender}
              onChange={handleChange}
              className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Age (Years)</label>
            <input
              type="number"
              name="age"
              min="10"
              max="100"
              value={profileForm.age}
              onChange={handleChange}
              className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>

          {/* Height */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Height (cm)</label>
            <input
              type="number"
              name="height"
              min="100"
              max="250"
              value={profileForm.height}
              onChange={handleChange}
              className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Weight (kg)</label>
            <input
              type="number"
              name="weight"
              min="30"
              max="300"
              value={profileForm.weight}
              onChange={handleChange}
              className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>

          {/* Activity Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Activity Level</label>
            <select
              name="activityLevel"
              value={profileForm.activityLevel}
              onChange={handleChange}
              className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="sedentary">Sedentary (Little or no exercise)</option>
              <option value="light">Lightly Active (Exercise 1-3 days/wk)</option>
              <option value="moderate">Moderately Active (Exercise 3-5 days/wk)</option>
              <option value="active">Very Active (Hard exercise 6-7 days/wk)</option>
              <option value="very_active">Extremely Active (Athlete/Physical Job)</option>
            </select>
          </div>

          {/* Weight Goal */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Fitness Goal</label>
            <select
              name="weightGoal"
              value={profileForm.weightGoal}
              onChange={handleChange}
              className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="weight_loss">Weight Loss (Fat Loss Deficit)</option>
              <option value="maintenance">Maintenance (Balanced Energy)</option>
              <option value="weight_gain">Weight Gain / Bulking (Surplus)</option>
            </select>
          </div>

          {/* Dietary Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Dietary Preference</label>
            <select
              name="dietaryType"
              value={profileForm.dietaryType}
              onChange={handleChange}
              className="w-full bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="desi">Desi Pakistani Cuisine</option>
              <option value="keto">Ketogenic (Low Carb)</option>
              <option value="high_protein">High Protein Fitness</option>
              <option value="vegetarian">Vegetarian / Sabzi</option>
              <option value="vegan">100% Plant-Based Vegan</option>
              <option value="balanced">Standard Balanced</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <FaSave size={14} />
          )}
          <span>{loading ? "Updating Profile..." : "Save All Changes"}</span>
        </button>
      </form>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-red-50/50 rounded-3xl p-6 sm:p-8 border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-red-600 text-base">Danger Zone: Delete Account</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Permanently delete your user profile and all historical saved meal plans from database.
          </p>
        </div>
        <button
          onClick={() => setDeleteAccountModal(true)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-6 py-3 rounded-full transition shadow-sm shrink-0"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Account Modal */}
      {deleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-orange-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2 font-headline">Delete Your Account?</h3>
            <p className="text-xs text-gray-500 mb-6">
              This will permanently erase your profile and all saved meal history. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteAccountModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
