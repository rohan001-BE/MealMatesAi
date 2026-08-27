"use client";

import React, { useState } from "react";
import { FiUser } from "react-icons/fi";

export default function UserAvatar({
  src,
  name = "User",
  className = "w-8 h-8 rounded-full",
  alt = "User Avatar",
  textClassName = "text-xs font-black text-white",
}) {
  const [hasError, setHasError] = useState(false);

  const initial = name && typeof name === "string" ? name.trim().charAt(0).toUpperCase() : "";

  // If no source is provided or image failed to load, display premium fallback avatar
  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 select-none shadow-xs shrink-0 ${className}`}
        aria-label={alt}
      >
        {initial ? (
          <span className={textClassName}>{initial}</span>
        ) : (
          <FiUser className="text-white w-1/2 h-1/2" />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`object-cover select-none shrink-0 ${className}`}
    />
  );
}
