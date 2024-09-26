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


export function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Debugging output
  console.log(
    `Date now: ${now.toISOString()}, Comment date: ${date.toISOString()}, Seconds ago: ${seconds}`
  );

  let interval = seconds / 31536000;

  if (interval > 1) return Math.floor(interval) + "yrs";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min";
  return Math.floor(seconds) + "s";
};
