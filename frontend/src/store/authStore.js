import { create } from "zustand";
import api from "../lib/api";
import { toast } from "react-toastify";

let isSessionExpired = false;

// Session expiration middleware hook
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.data?.message === "SESSION_EXPIRED" &&
      !isSessionExpired &&
      useAuthStore.getState().isAuthenticated
    ) {
      isSessionExpired = true;
      toast.error("Your session has expired. Please login again.");
      useAuthStore.getState().clearAuth();
      setTimeout(() => {
        isSessionExpired = false;
      }, 5000);
    }
    return Promise.reject(error);
  }
);

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  profileImage: null,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      profileImage: user?.profileImage || null,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setProfileImage: (profileImage) =>
    set((state) => ({
      profileImage,
      user: state.user ? { ...state.user, profileImage } : null,
    })),

  fetchUser: async () => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("meal_mates_token");
    if (!token) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        profileImage: null,
      });
      return false;
    }
    try {
      const { data } = await api.get("/auth/get-profile");
      if (data && data.id) {
        set({
          user: data,
          isAuthenticated: true,
          isLoading: false,
          profileImage: data.profileImage || null,
        });
        return true;
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          profileImage: null,
        });
        return false;
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        profileImage: null,
      });
      return false;
    }
  },

  logout: async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("meal_mates_token");
    }
    set({ user: null, isAuthenticated: false, profileImage: null });
  },

  uploadProfileImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await api.post("/users/upload-profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      set((state) => ({
        user: state.user
          ? { ...state.user, profileImage: data.profileImage }
          : null,
        profileImage: data.profileImage,
      }));

      return data.profileImage;
    } catch (err) {
      console.error(
        "Error uploading profile image:",
        err.response?.data?.message || err.message
      );
      throw new Error(
        err.response?.data?.message || "Failed to upload profile image"
      );
    }
  },

  deleteProfileImage: async () => {
    try {
      await api.delete("/users/delete-profile-image");

      set((state) => ({
        user: state.user ? { ...state.user, profileImage: null } : null,
        profileImage: null,
      }));

      return true;
    } catch (err) {
      console.error("Error deleting profile image:", err);
      throw new Error("Failed to delete profile image");
    }
  },

  deleteUser: async () => {
    try {
      await api.delete("/users/delete-user");
      if (typeof window !== "undefined") {
        localStorage.removeItem("meal_mates_token");
      }
      set({ user: null, isAuthenticated: false, profileImage: null });
      console.log("User deleted successfully.");
    } catch (err) {
      console.error("Error deleting user:", err);
      throw new Error("Failed to delete user. Please try again.");
    }
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("meal_mates_token");
    }
    set({ user: null, isAuthenticated: false, profileImage: null });
  }
}));

export default useAuthStore;
