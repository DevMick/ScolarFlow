/**
 * Génère le nom d'une année scolaire à partir des années
 * Ex: "2024-2025"
 */
export function generateSchoolYearName(startYear: number, endYear: number): string {
  return `${startYear}-${endYear}`;
}

/**
 * Ajoute la propriété name à une année scolaire
 */
export function addSchoolYearName<T extends { startYear: number; endYear: number }>(
  schoolYear: T
): T & { name: string } {
  return {
    ...schoolYear,
    name: generateSchoolYearName(schoolYear.startYear, schoolYear.endYear),
  };
}

/**
 * Ajoute la propriété name à un tableau d'années scolaires
 */
export function addSchoolYearNames<T extends { startYear: number; endYear: number }>(
  schoolYears: T[]
): Array<T & { name: string }> {
  return schoolYears.map(addSchoolYearName);
}

