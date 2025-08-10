import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Tag, Plus } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
}

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  availableTags,
  selectedTags,
  onTagsChange,
  placeholder = "جستجو و انتخاب برچسب‌ها...",
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter tags based on search query and exclude already selected tags
  useEffect(() => {
    const filtered = availableTags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedTags.includes(tag.id)
    );
    setFilteredTags(filtered);
    setSelectedIndex(-1); // Reset selection when filtering
  }, [searchQuery, availableTags, selectedTags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleTagSelect = (tag: Tag) => {
    if (!selectedTags.includes(tag.id)) {
      onTagsChange([...selectedTags, tag.id]);
    }
    setSearchQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleTagRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter(id => id !== tagId));
  };

  const getSelectedTagNames = () => {
    return selectedTags.map(tagId => 
      availableTags.find(tag => tag.id === tagId)?.name || tagId
    );
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputClick = () => {
    setIsOpen(!isOpen); // Toggle dropdown
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredTags.length > 0) {
      e.preventDefault();
      const tagToSelect = selectedIndex >= 0 ? filteredTags[selectedIndex] : filteredTags[0];
      handleTagSelect(tagToSelect);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredTags.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : filteredTags.length - 1
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
          onBlur={() => {
            // Small delay to allow click events on dropdown items to fire first
            setTimeout(() => {
              if (!dropdownRef.current?.contains(document.activeElement)) {
                setIsOpen(false);
              }
            }, 100);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 cursor-text"
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <Search className="w-4 h-4" />
        </button>
        {selectedTags.length > 0 && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedTags.length}
            </span>
          </div>
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-200 ease-out">
          {getSelectedTagNames().map((tagName, index) => (
            <div
              key={selectedTags[index]}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 animate-in zoom-in-50 duration-300"
            >
              <Tag className="w-3 h-3 mr-1.5" />
              <span>{tagName}</span>
              <button
                onClick={() => handleTagRemove(selectedTags[index])}
                className="ml-2 p-0.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
                title="حذف برچسب"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <Tag className="w-3 h-3 mr-1" />
          <span>هیچ برچسبی انتخاب نشده است</span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200 ease-out"
        >
          {filteredTags.length > 0 ? (
            <div className="py-1">
              {filteredTags.map((tag, index) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagSelect(tag)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 text-right flex items-center space-x-2 space-x-reverse transition-all duration-200 ${
                    index === selectedIndex 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm' 
                      : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:shadow-sm'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                    index === selectedIndex 
                      ? 'bg-white bg-opacity-20 text-white' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Plus className="w-3 h-3" />
                  </div>
                  <span className={`font-medium ${
                    index === selectedIndex ? 'text-white' : 'text-gray-900'
                  }`}>{tag.name}</span>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="px-4 py-6 text-center text-gray-500">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm">هیچ برچسبی یافت نشد</p>
              <p className="text-xs text-gray-400 mt-1">کلمات کلیدی دیگری امتحان کنید</p>
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm">برای جستجو تایپ کنید</p>
              <p className="text-xs text-gray-400 mt-1">برچسب‌های موجود را جستجو کنید</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagSelector; 