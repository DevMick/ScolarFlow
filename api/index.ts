/// <reference types="@vercel/node" />
// Re-export du handler Vercel depuis apps/api/src/index.ts
// Ce fichier est le point d'entrée Vercel qui re-exporte simplement le handler principal
export { default } from '../apps/api/src/index';
