
import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface FilterConfig<T> {
  searchFields?: (keyof T)[];
  initialSort?: { key: keyof T; dir: SortDirection };
  filterPredicate?: (item: T) => boolean;
}

export function useDataFilter<T>(data: T[], config: FilterConfig<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; dir: SortDirection }>(
    config.initialSort || { key: 'id' as keyof T, dir: 'asc' }
  );

  const handleSort = (key: keyof T) => {
    setSortConfig(current => ({
      key,
      dir: current.key === key && current.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // 1. External Filter Predicate
    if (config.filterPredicate) {
      result = result.filter(config.filterPredicate);
    }

    // 2. Search
    if (searchQuery && config.searchFields) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => 
        config.searchFields!.some(field => 
          String(item[field]).toLowerCase().includes(lowerQuery)
        )
      );
    }

    // 3. Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        // Handle Dates
        const timeA = new Date(String(valA)).getTime();
        const timeB = new Date(String(valB)).getTime();
        
        if (!isNaN(timeA) && !isNaN(timeB)) {
           return sortConfig.dir === 'asc' ? timeA - timeB : timeB - timeA;
        }

        if (valA === valB) return 0;
        if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, sortConfig, config.filterPredicate, config.searchFields]);

  return {
    data: processedData,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort
  };
}
