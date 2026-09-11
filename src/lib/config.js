export const CONFIG = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || "",
  GEMINI_MODEL: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash",
  ADMIN_EMAIL: import.meta.env.VITE_ADMIN_EMAIL || "amansingh28888@gmail.com",
  POINTS_PER_REPORT: Number(import.meta.env.VITE_POINTS_PER_REPORT || 10),
  POINTS_TO_INR_RATE: Number(import.meta.env.VITE_POINTS_TO_INR_RATE || 0.5),
  MIN_WITHDRAW_POINTS: Number(import.meta.env.VITE_MIN_WITHDRAW_POINTS || 50),
};
