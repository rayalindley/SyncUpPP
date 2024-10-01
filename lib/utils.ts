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

  // Adjust the date to account for timezone differences (local time handling)
  const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  // Check if the date is valid and the user is at least 18 years old
  if (
    adjustedDate instanceof Date &&
    !isNaN(adjustedDate.getTime()) &&
    (age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0))))
  ) {
    return true;
  }
  return false;
}

export function timeAgo(dateString: string) {
  // If the commentDate string is in UTC, ensure it's parsed as UTC.
  // You can append 'Z' to the date string to enforce UTC interpretation.
  const commentDate = new Date(dateString.endsWith("Z") ? dateString : dateString + "Z");

  const now = new Date();

  const timeDifferenceInSeconds = Math.floor(
    (now.getTime() - commentDate.getTime()) / 1000
  );

  // Helper function to format date in 12-hour AM/PM format
  function formatAMPM(date: Date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // hour '0' should be '12'
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes.toString(); // add leading zero to minutes
    return `${hours}:${minutes} ${ampm}`;
  }

  // Convert seconds into minutes, hours, days, months, years
  let interval = timeDifferenceInSeconds / 31536000; // years
  if (interval >= 1) return Math.floor(interval) + " yrs";

  interval = timeDifferenceInSeconds / 2592000; // months
  if (interval >= 1) return Math.floor(interval) + " m";

  interval = timeDifferenceInSeconds / 86400; // days
  if (interval >= 1) return Math.floor(interval) + " d";

  interval = timeDifferenceInSeconds / 3600; // hours
  if (interval >= 1) return Math.floor(interval) + " h";

  interval = timeDifferenceInSeconds / 60; // minutes
  if (interval >= 1) return Math.floor(interval) + " min";

  return Math.floor(timeDifferenceInSeconds) + " s"; // seconds
}
