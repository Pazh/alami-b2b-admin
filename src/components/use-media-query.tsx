'use client';

// Public imports
import { useState, useEffect } from 'react';

const useMediaQuery = (query: string): boolean => {
  // Hooks
  const [value, setValue] = useState<boolean>(false);

  // Functions
  useEffect(() => {
    const onChange = (event: MediaQueryListEvent): void => {
      setValue(event.matches);
    };

    const result = matchMedia(query);
    result.addEventListener('change', onChange);
    setValue(result.matches);

    return () => result.removeEventListener('change', onChange);
  }, [query]);

  return value;
};

export default useMediaQuery;
