import { useState, useCallback, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import { useDebounce } from './useDebounce';
import type { Student } from '@edustats/shared';

interface SearchOptions {
  threshold?: number; // Seuil de similarité pour Fuse.js (0 = exact, 1 = match anything)
  keys?: string[]; // Champs à rechercher
  minLength?: number; // Longueur minimale du terme de recherche
  maxResults?: number; // Nombre maximum de résultats
}

const defaultOptions: SearchOptions = {
  threshold: 0.4,
  keys: ['firstName', 'lastName', 'studentNumber', 'parentContact'],
  minLength: 2,
  maxResults: 50,
};

export const useSearch = (students: Student[], options: SearchOptions = {}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const config = { ...defaultOptions, ...options };
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Configuration Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(students, {
      keys: config.keys,
      threshold: config.threshold,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: config.minLength,
      ignoreLocation: true,
      findAllMatches: true,
    });
  }, [students, config.keys, config.threshold, config.minLength]);

  // Résultats de recherche
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < (config.minLength || 2)) {
      return students;
    }

    const results = fuse.search(debouncedSearchTerm);
    return results
      .slice(0, config.maxResults)
      .map(result => result.item);
  }, [fuse, debouncedSearchTerm, students, config.minLength, config.maxResults]);

  // Recherche avec mise en évidence
  const searchWithHighlights = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < (config.minLength || 2)) {
      return students.map(student => ({ student, matches: [] }));
    }

    const results = fuse.search(debouncedSearchTerm);
    return results.slice(0, config.maxResults).map(result => ({
      student: result.item,
      matches: result.matches || [],
      score: result.score || 0,
    }));
  }, [fuse, debouncedSearchTerm, students, config.minLength, config.maxResults]);

  // Actions
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    setIsSearching(term.length >= (config.minLength || 2));
  }, [config.minLength]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setIsSearching(false);
  }, []);

  const highlightMatch = useCallback((text: string, searchTerm: string): string => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }, []);

  // Recherche rapide par type
  const searchByName = useCallback((name: string) => {
    const results = students.filter(student => 
      student.firstName.toLowerCase().includes(name.toLowerCase()) ||
      student.lastName.toLowerCase().includes(name.toLowerCase())
    );
    return results.slice(0, config.maxResults || 50);
  }, [students, config.maxResults]);

  const searchByStudentNumber = useCallback((number: string) => {
    return students.filter(student => 
      student.studentNumber?.toLowerCase().includes(number.toLowerCase())
    );
  }, [students]);

  const searchByParentContact = useCallback((contact: string) => {
    return students.filter(student => 
      student.parentContact?.toLowerCase().includes(contact.toLowerCase())
    );
  }, [students]);

  // Suggestions de recherche
  const searchSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 1) return [];

    const suggestions = new Set<string>();
    
    students.forEach(student => {
      // Suggestions de prénoms
      if (student.firstName.toLowerCase().startsWith(searchTerm.toLowerCase())) {
        suggestions.add(student.firstName);
      }
      
      // Suggestions de noms
      if (student.lastName.toLowerCase().startsWith(searchTerm.toLowerCase())) {
        suggestions.add(student.lastName);
      }
      
      // Suggestions de numéros d'élève
      if (student.studentNumber?.toLowerCase().startsWith(searchTerm.toLowerCase())) {
        suggestions.add(student.studentNumber);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }, [students, searchTerm]);

  // Statistiques de recherche
  const searchStats = useMemo(() => {
    return {
      totalStudents: students.length,
      resultsCount: searchResults.length,
      isFiltered: debouncedSearchTerm.length >= (config.minLength || 2),
      hasResults: searchResults.length > 0,
      noResults: debouncedSearchTerm.length >= (config.minLength || 2) && searchResults.length === 0,
    };
  }, [students.length, searchResults.length, debouncedSearchTerm, config.minLength]);

  // Effet pour gérer l'état de recherche
  useEffect(() => {
    setIsSearching(searchTerm.length >= (config.minLength || 2));
  }, [searchTerm, config.minLength]);

  return {
    // État
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    
    // Résultats
    searchResults,
    searchWithHighlights,
    searchSuggestions,
    searchStats,
    
    // Actions
    search,
    clearSearch,
    highlightMatch,
    
    // Recherches spécialisées
    searchByName,
    searchByStudentNumber,
    searchByParentContact,
    
    // Computed
    hasSearchTerm: searchTerm.length > 0,
    isValidSearch: searchTerm.length >= (config.minLength || 2),
    isEmpty: searchStats.noResults,
  };
};
