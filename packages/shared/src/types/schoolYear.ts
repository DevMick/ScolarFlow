export interface SchoolYear {
  id: number;
  userId: number;
  startYear: number; // Ex: 2024
  endYear: number; // Ex: 2025
  isActive: boolean; // Année en cours
  createdAt: Date;
  updatedAt: Date;
  // Propriété calculée côté frontend
  name?: string; // Ex: "2024-2025" (généré à partir de startYear-endYear)
}

export interface CreateSchoolYearData {
  startYear: number;
  endYear: number;
}

export interface UpdateSchoolYearData {
  startYear?: number;
  endYear?: number;
  isActive?: boolean;
}

export interface SchoolYearResponse {
  success: boolean;
  schoolYear: SchoolYear;
  message?: string;
}

export interface SchoolYearsResponse {
  success: boolean;
  schoolYears: SchoolYear[];
  activeSchoolYear?: SchoolYear;
}

