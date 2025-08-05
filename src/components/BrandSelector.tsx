import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building, Plus } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
}

interface BrandSelectorProps {
  availableBrands: Brand[];
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  placeholder?: string;
  className?: string;
}

const BrandSelector: React.FC<BrandSelectorProps> = ({
  availableBrands,
  selectedBrands,
  onBrandsChange,
  placeholder = "جستجو و انتخاب برندها...",
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter brands based on search query and exclude already selected brands
  useEffect(() => {
    const filtered = availableBrands.filter(brand => 
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedBrands.includes(brand.id)
    );
    setFilteredBrands(filtered);
    setSelectedIndex(-1); // Reset selection when filtering
  }, [searchQuery, availableBrands, selectedBrands]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBrandSelect = (brand: Brand) => {
    if (!selectedBrands.includes(brand.id)) {
      onBrandsChange([...selectedBrands, brand.id]);
    }
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleBrandRemove = (brandId: string) => {
    onBrandsChange(selectedBrands.filter(id => id !== brandId));
  };

  const getSelectedBrandNames = () => {
    return selectedBrands.map(brandId => 
      availableBrands.find(brand => brand.id === brandId)?.name || brandId
    );
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  // Auto-open dropdown when component mounts if there are selected brands
  useEffect(() => {
    if (selectedBrands.length > 0 && !isOpen) {
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedBrands.length, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredBrands.length > 0) {
      e.preventDefault();
      const brandToSelect = selectedIndex >= 0 ? filteredBrands[selectedIndex] : filteredBrands[0];
      handleBrandSelect(brandToSelect);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredBrands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : filteredBrands.length - 1
      );
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 cursor-text"
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <Search className="w-4 h-4" />
        </button>
        {selectedBrands.length > 0 && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {selectedBrands.length}
            </span>
          </div>
        )}
      </div>

      {/* Selected Brands Display */}
      {selectedBrands.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-200 ease-out">
          {getSelectedBrandNames().map((brandName, index) => (
            <div
              key={selectedBrands[index]}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 animate-in zoom-in-50 duration-300"
            >
              <Building className="w-3 h-3 mr-1.5" />
              <span>{brandName}</span>
              <button
                onClick={() => handleBrandRemove(selectedBrands[index])}
                className="ml-2 p-0.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
                title="حذف برند"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <Building className="w-3 h-3 mr-1" />
          <span>هیچ برندی انتخاب نشده است</span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200 ease-out"
        >
          {filteredBrands.length > 0 ? (
            <div className="py-1">
              {filteredBrands.map((brand, index) => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandSelect(brand)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 text-right flex items-center space-x-2 space-x-reverse transition-all duration-200 ${
                    index === selectedIndex 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm' 
                      : 'hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:shadow-sm'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                    index === selectedIndex 
                      ? 'bg-white bg-opacity-20 text-white' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    <Plus className="w-3 h-3" />
                  </div>
                  <span className={`font-medium ${
                    index === selectedIndex ? 'text-white' : 'text-gray-900'
                  }`}>{brand.name}</span>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="px-4 py-6 text-center text-gray-500">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm">هیچ برندی یافت نشد</p>
              <p className="text-xs text-gray-400 mt-1">کلمات کلیدی دیگری امتحان کنید</p>
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                <Building className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm">برای جستجو تایپ کنید</p>
              <p className="text-xs text-gray-400 mt-1">برندهای موجود را جستجو کنید</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandSelector; 