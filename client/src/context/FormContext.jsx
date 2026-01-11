import React, { createContext, useContext, useState, useEffect } from 'react';

const FormContext = createContext();

export const useFormData = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormData must be used within FormProvider');
  }
  return context;
};

export const FormProvider = ({ children }) => {
  // Load initial state from localStorage
  const loadFromStorage = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  };

  const [units, setUnits] = useState(() =>
    loadFromStorage('fanSelector_units', {
      airFlow: null,
      pressure: null,
      power: null,
      fanType: null,
      centrifugalFanType: null,
    })
  );

  const [input, setInput] = useState(() =>
    loadFromStorage('fanSelector_input', {
      RPM: null,
      TempC: null,
      airFlow: null,
      staticPressure: null,
      NoPhases: null,
      Safety: null,
      SPF: null,
      // Sound Data fields
      directivityFactor: 2,  // Q - default value
      distanceFromSource: 1, // r - default value in meters
      // Fan Unit No field
      fanUnitNo: "EX-01",    // Default value for datasheet naming
    })
  );

  const [results, setResults] = useState(() =>
    loadFromStorage('fanSelector_results', null)
  );

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('fanSelector_units', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('fanSelector_input', JSON.stringify(input));
  }, [input]);

  useEffect(() => {
    localStorage.setItem('fanSelector_results', JSON.stringify(results));
  }, [results]);

  const clearFormData = () => {
    setUnits({
      airFlow: null,
      pressure: null,
      power: null,
      fanType: null,
      centrifugalFanType: null,
    });
    setInput({
      RPM: null,
      TempC: null,
      airFlow: null,
      staticPressure: null,
      NoPhases: null,
      Safety: null,
      SPF: null,
      directivityFactor: 2,
      distanceFromSource: 1,
      fanUnitNo: "EX-01",
    });
    setResults(null);
    localStorage.removeItem('fanSelector_units');
    localStorage.removeItem('fanSelector_input');
    localStorage.removeItem('fanSelector_results');
  };

  const value = {
    units,
    setUnits,
    input,
    setInput,
    results,
    setResults,
    clearFormData,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};
