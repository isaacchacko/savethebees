import { useState, useEffect } from 'react';

const useLocalStorageMulti = (keys, defaultValue) => {
  const [values, setValues] = useState(() => {
    if (typeof window === 'undefined') {
      return Object.fromEntries(keys.map((key, index) => [key, defaultValue]));
    }

    try {
      const storedValues = keys.map((key) => {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
      });
      return Object.fromEntries(keys.map((key, index) => [key, storedValues[index]]));
    } catch (error) {
      console.error('Error initializing local storage:', error);
      return Object.fromEntries(keys.map((key, index) => [key, defaultValue]));
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Object.keys(values).forEach((key) => {
        localStorage.setItem(key, JSON.stringify(values[key]));
      });
    }
  }, [values]);

  const setValue = (key, value) => {
    setValues((prevValues) => ({ ...prevValues, [key]: value }));
  };

  return [values, setValue];
};

export default useLocalStorageMulti;
