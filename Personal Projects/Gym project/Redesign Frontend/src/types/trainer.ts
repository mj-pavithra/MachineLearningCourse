export enum Type {
  PART_TIME = "Part Time",
  FULL_TIME = "Full Time",
}

export enum Status {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

export interface Trainer {
  _id: string;
  createdAt: string;
  status: Status;
  firstName: string;
  lastName: string;
  nic: string;
  email: string;
  mobile: string;
  profileImage?: string;
  isFullTime: boolean;
  isAdmin: boolean;
  isActive: boolean;
  gymId: string;
}

export enum PaymentStatus {
  PAID = "Paid",
  NOT_PAID = "Not Paid",
}

export interface Salaries {
  id: number;
  date: string;
  trainerName: string;
  currentSession: string;
  totalSalary: string;
  type: string;
  status: string;
}


