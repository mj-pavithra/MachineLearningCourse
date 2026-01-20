export interface UserSession {
  id: string;
  name: string;
  email: string;
  token: string;
  refreshToken: string | null;
  mobile?: string;
  isAdmin: boolean;
  isFullTime?: boolean;
  gymId: string;
  memberId?: string;
}

export interface Session {
  user: UserSession;
  expires: Date;
  createdAt: Date;
}

export interface PTSession {
  trainerId: string;
  trainerName: string;
  customerId: string;
  customerName: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  status: 'SUCCESS' | 'FAIL';
  message?: string;
  data?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    idToken: string;
    refreshToken?: string;
    isAdmin: boolean;
    isFullTime: boolean;
    mobile: string;
    gymId: string;
    memberId?: string;
  };
}


