export interface Activity {
  time: string;
  title: string;
  description: string;
  cost: number;
}

export interface DayItinerary {
  day: number;
  theme: string;
  activities: Activity[];
}

export interface Comment {
  id: string;
  name: string;
  comment: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  userId?: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  totalEstimatedBudget: number;
  itinerary: DayItinerary[];
  packingChecklist: string[];
  comments: Comment[];
  createdAt: string;
  fileAttached?: boolean;
  fileName?: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
