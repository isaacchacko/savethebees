import { useState, useEffect } from 'react';

const useLocalStorageMulti = (keys, defaultValues) => {
  const [values, setValues] = useState(() => {
    try {
      const storedValues = keys.map((key) => {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValues[keys.indexOf(key)];
      });
      return Object.fromEntries(keys.map((key, index) => [key, storedValues[index]]));
    } catch (error) {
      console.error('Error initializing local storage:', error);
      return Object.fromEntries(keys.map((key, index) => [key, defaultValues[index]]));
    }
  });

  useEffect(() => {
    Object.keys(values).forEach((key) => {
      localStorage.setItem(key, JSON.stringify(values[key]));
    });
  }, [values]);

  const setValue = (key, value) => {
    setValues((prevValues) => ({ ...prevValues, [key]: value }));
  };

  return [values, setValue];
};

export default useLocalStorageMulti;
