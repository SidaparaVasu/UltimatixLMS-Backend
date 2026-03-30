import { User } from "@/types/auth.types";

/**
 * Returns the full name of the user from their profile.
 * Falls back to username if profile or names are missing.
 */
export const getFullName = (user: User | null): string => {
  if (!user) return "Guest User";
  if (!user.profile?.first_name) return user.username;
  
  const { first_name, last_name } = user.profile;
  return `${first_name} ${last_name || ""}`.trim();
};

/**
 * Returns initials (e.g., "GU") for a user.
 * Falls back to first two letters of username if profile is missing.
 */
export const getInitials = (user: User | null): string => {
  if (!user) return "GU";
  
  if (user.profile?.first_name) {
    const first = user.profile.first_name[0];
    const last = user.profile.last_name ? user.profile.last_name[0] : "";
    return (first + last).toUpperCase();
  }
  
  return user.username.slice(0, 2).toUpperCase();
};

/**
 * Returns the primary role name for the user.
 * Usually the first active role in the list.
 */
export const getPrimaryRoleName = (user: User | null): string => {
  if (!user || !user.roles || user.roles.length === 0) return "LMS Member";
  return user.roles[0].role_name;
};
