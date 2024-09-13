import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to validate date
export function isDateValid(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  // Check if the date is valid and the user is at least 18 years old
  if (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    (age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0))))
  ) {
    return true;
  }
  return false;
}
