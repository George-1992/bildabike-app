import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for optimal className handling
 * @param {...any} inputs - Class names to be combined
 * @returns {string} Merged and optimized class names
 */
export const cn = (...inputs) => {
  return twMerge(clsx(inputs));
}
