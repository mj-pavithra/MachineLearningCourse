export enum EquipmentType {
  DUMBBELL = 'dumbbell',
  BARBELL = 'barbell',
  KETTLEBELL = 'kettlebell',
  PLATE = 'plate',
  EZ_BAR = 'ez_bar',
  WEIGHT_STACK = 'weight_stack',
  SMITH_MACHINE = 'smith_machine',
  CABLE_MACHINE = 'cable_machine',
  LEG_PRESS_MACHINE = 'leg_press_machine',
  CHEST_PRESS_MACHINE = 'chest_press_machine',
  LAT_PULLDOWN_MACHINE = 'lat_pulldown_machine',
  LEG_EXTENSION_MACHINE = 'leg_extension_machine',
  LEG_CURL_MACHINE = 'leg_curl_machine',
  PEC_DECK_MACHINE = 'pec_deck_machine',
  ROWING_MACHINE = 'rowing_machine',
  FLAT_BENCH = 'flat_bench',
  INCLINE_BENCH = 'incline_bench',
  DECLINE_BENCH = 'decline_bench',
  POWER_RACK = 'power_rack',
  SQUAT_RACK = 'squat_rack',
  TREADMILL = 'treadmill',
  STATIONARY_BIKE = 'stationary_bike',
  ELLIPTICAL = 'elliptical',
  STAIR_CLIMBER = 'stair_climber',
  ROWING_ERG = 'rowing_erg',
  SPIN_BIKE = 'spin_bike',
  PULLUP_BAR = 'pullup_bar',
  DIP_STATION = 'dip_station',
  PARALLEL_BARS = 'parallel_bars',
  RESISTANCE_BAND = 'resistance_band',
  MEDICINE_BALL = 'medicine_ball',
  BOSU_BALL = 'bosu_ball',
  BALANCE_BOARD = 'balance_board',
  SANDBAG = 'sandbag',
  SLAM_BALL = 'slam_ball',
  MAT = 'mat',
  FOAM_ROLLER = 'foam_roller',
  JUMP_ROPE = 'jump_rope',
  ANKLE_WEIGHT = 'ankle_weight',
  GYM_RING = 'gym_ring',
  SUSPENSION_TRAINER = 'suspension_trainer',
  UNKNOWN = 'unknown'
}

export enum MuscleGroup {
  CHEST = 'chest',
  UPPER_CHEST = 'upper_chest',
  LOWER_CHEST = 'lower_chest',
  SHOULDERS = 'shoulders',
  FRONT_DELTS = 'front_delts',
  SIDE_DELTS = 'side_delts',
  REAR_DELTS = 'rear_delts',
  TRAPS = 'traps',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  FOREARMS = 'forearms',
  LATS = 'lats',
  RHOMBOIDS = 'rhomboids',
  LOWER_BACK = 'lower_back',
  SPINAL_ERECTORS = 'spinal_erectors',
  ABS = 'abs',
  OBLIQUES = 'obliques',
  TRANSVERSE_ABS = 'transverse_abs',
  QUADRICEPS = 'quadriceps',
  HAMSTRINGS = 'hamstrings',
  GLUTES = 'glutes',
  CALVES = 'calves',
  HIP_FLEXORS = 'hip_flexors',
  ADDUCTORS = 'adductors',
  ABDUCTORS = 'abductors',
  FULL_BODY = 'full_body',
  CARDIO = 'cardio',
  STABILIZERS = 'stabilizers',
  CORE_STRENGTH = 'core_strength',
  UNKNOWN = 'unknown',
}

export enum EquipmentStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired'
}

export interface Location {
  room?: string;
  zone?: string;
}

export type Equipment = {
  _id?: string;
  equipmentId: string;
  gymId: string;
  name: string;
  sku?: string;
  type: EquipmentType;
  muscleGroups: MuscleGroup[];
  model: string;
  brand: string;
  serialNumber?: string;
  location: Location;
  quantityTotal: number;
  quantityAvailable: number;
  status: EquipmentStatus;
  lastServicedAt?: string;
  maintenanceIntervalDays?: number;
  nextServiceDue?: string;
  images?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  equipmentType?: EquipmentType;
  equName?: string;
  equipmentStatus?: EquipmentStatus;
};

export interface CreateEquipmentDto {
  name: string;
  type: EquipmentType;
  muscleGroups: MuscleGroup[];
  model: string;
  brand: string;
  location: Location;
  quantityTotal: number;
  sku?: string;
  serialNumber?: string;
  maintenanceIntervalDays?: number;
  images?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateEquipmentDto {
  name?: string;
  type?: EquipmentType;
  muscleGroups?: MuscleGroup[];
  model?: string;
  brand?: string;
  location?: Location;
  quantityTotal?: number;
  sku?: string;
  serialNumber?: string;
  maintenanceIntervalDays?: number;
  images?: string[];
  metadata?: Record<string, any>;
}


