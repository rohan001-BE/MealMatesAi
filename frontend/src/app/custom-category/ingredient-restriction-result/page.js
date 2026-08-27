"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomIngResultRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/custom-recipes");
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
    </div>
  );
}
