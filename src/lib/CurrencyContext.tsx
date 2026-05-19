import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency, CURRENCIES, getCurrencyByCode } from '../constants/currencies';

interface CurrencyContextType {
  selectedCurrency: Currency;
  setCurrency: (code: string) => void;
  formatPrice: (amount: number, isMarketplace?: boolean) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('efado_currency');
    return saved ? getCurrencyByCode(saved) : CURRENCIES[0];
  });

  const setCurrency = (code: string) => {
    const currency = getCurrencyByCode(code);
    setSelectedCurrency(currency);
    localStorage.setItem('efado_currency', code);
  };

  // Mock exchange rates: amount of [Selected Currency] per 1 USD
  // In a real app, this would be fetched from an API
  const MOCK_RATES: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 151,
    NGN: 1450,
    INR: 83,
    // Add others as needed or use a default
  };

  const formatPrice = (amount: number, isMarketplace = false) => {
    if (isMarketplace) {
      // Logic: Assume incoming amount is in USD for Marketplace (standard base)
      // Convert USD to current selection
      const rate = MOCK_RATES[selectedCurrency.code] || 1;
      const converted = amount * rate;
      return `${selectedCurrency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Flat logic: just change the secondary part, amount stays the same
    return `${selectedCurrency.symbol}${amount.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
