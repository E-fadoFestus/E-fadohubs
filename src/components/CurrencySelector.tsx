import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Check, ChevronDown, Search } from 'lucide-react';
import { useCurrency } from '../lib/CurrencyContext';
import { CURRENCIES, Currency } from '../constants/currencies';

export const CurrencySelector: React.FC = () => {
  const { selectedCurrency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all text-sm font-bold border border-indigo-100"
      >
        <Globe className="w-4 h-4" />
        <span>{selectedCurrency.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-[100] overflow-hidden flex flex-col max-h-[400px]"
          >
            <div className="p-3 border-b border-gray-50 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                autoFocus
                type="text"
                placeholder="Search currency..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm outline-none bg-transparent"
              />
            </div>
            
            <div className="overflow-y-auto overflow-x-hidden flex-1 no-scrollbar">
              {filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => {
                    setCurrency(currency.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 text-left hover:bg-indigo-50 transition-colors ${
                    selectedCurrency.code === currency.code ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${selectedCurrency.code === currency.code ? 'text-indigo-600' : 'text-gray-900'}`}>
                      {currency.code} - {currency.symbol}
                    </span>
                    <span className="text-xs text-gray-500">{currency.name}</span>
                  </div>
                  {selectedCurrency.code === currency.code && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              ))}
              {filteredCurrencies.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No currencies found.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
