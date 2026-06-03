import { User } from '../types';

export function getStoredToken(): string | null {
  return localStorage.getItem('itinerary_token');
}

export function setStoredToken(token: string) {
  localStorage.setItem('itinerary_token', token);
}

export function clearStoredToken() {
  localStorage.removeItem('itinerary_token');
  localStorage.removeItem('itinerary_user');
}

export function getStoredUser(): User | null {
  const user = localStorage.getItem('itinerary_user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  localStorage.setItem('itinerary_user', JSON.stringify(user));
}
