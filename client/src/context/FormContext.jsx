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
      power: "kW",
      fanType: null,
      centrifugalFanType: null,
      insulationClass: "F",
    })
  );

  const [input, setInput] = useState(() => {
    const stored = loadFromStorage('fanSelector_input', null);
    // Merge stored values with defaults to ensure critical fields always have values
    const defaults = {
      RPM: 1440,
      TempC: 20,
      airFlow: null,
      staticPressure: null,
      NoPhases: 3,
      Safety: 5,
      SPF: 10,
      // Sound Data fields
      directivityFactor: 1,  // Q - default value
      distanceFromSource: 3, // r - default value in meters
      // Centrifugal-specific fields
      frictionLosses: 15,
      beltType: "SPA",
      motorPoles: 4,
      maxRPMChange: 50,
      // Fan Unit No field
      fanUnitNo: "EX-01",    // Default value for datasheet naming
    };
    // If stored exists, merge with defaults (stored values take precedence if not null)
    if (stored) {
      return {
        ...defaults,
        ...Object.fromEntries(
          Object.entries(stored).filter(([_, v]) => v !== null && v !== undefined)
        ),
      };
    }
    return defaults;
  });

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
      power: "kW",
      fanType: null,
      centrifugalFanType: null,
      insulationClass: "F",
    });
    setInput({
      RPM: 1440,
      TempC: 20,
      airFlow: null,
      staticPressure: null,
      NoPhases: 3,
      Safety: 5,
      SPF: 10,
      directivityFactor: 1,
      distanceFromSource: 3,
      frictionLosses: 15,
      beltType: "SPA",
      motorPoles: 4,
      maxRPMChange: 50,
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
