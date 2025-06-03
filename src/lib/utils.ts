import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Security utility to mask sensitive information
export function maskSensitiveInfo(text: string, visibleChars = 4): string {
  if (!text) return "";
  if (text.length <= visibleChars) return text;
  
  const visible = text.slice(-visibleChars);
  const masked = text.slice(0, -visibleChars).replace(/./g, '•');
  
  return masked + visible;
}

// Format date in a user-friendly way
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Generate a random color from our palette for user avatars
export function generateAvatarColor(name: string): string {
  const colors = [
    'bg-calm-300',
    'bg-calm-400',
    'bg-calm-500',
    'bg-calm-600',
    'bg-accent-300',
    'bg-accent-400',
    'bg-accent-500',
  ];
  
  // Simple hash function to get consistent colors for the same name
  const hash = name.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
}

// Helper to check if a user has a specific permission
export function hasPermission(
  userRole: string,
  requiredPermission: 'view' | 'edit' | 'delete'
): boolean {
  // Simple permission check based on role
  if (userRole === 'planner') {
    return true;
  } else if (userRole === 'executor') {
    // Executors can only view
    return requiredPermission === 'view';
  }
  return false;
}

// Create initials from name
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}