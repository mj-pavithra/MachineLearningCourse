import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Global Search Context
 * Manages a single search query that persists across all pages
 */

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

/**
 * SearchProvider - Wraps the application to provide global search state
 */
export const SearchProvider = ({ children }: SearchProviderProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchContext.Provider>
  );
};

/**
 * useSearch - Hook to access global search state
 * @throws Error if used outside SearchProvider
 */
export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
