import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

const SearchableSelect = ({
  options = [], // [{ value: '...', label: '...' }]
  value = '',
  onChange,
  placeholder = 'Select...',
  label,
  disabled = false,
  loading = false,
  error = false,
  required = false,
  size = 'md',
  className = '',
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listboxRef = useRef(null);

  // Find the label for the currently selected value
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const lowerQuery = searchQuery.toLowerCase();
    return options.filter((opt) => 
      opt.label.toLowerCase().includes(lowerQuery)
    );
  }, [options, searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1); // Reset highlight
      // Small timeout to allow DOM to render the input before focusing
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled || loading) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Auto-scroll listbox to highlighted item
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const listElement = listboxRef.current;
      const highlightedElement = listElement.children[highlightedIndex];
      if (highlightedElement) {
        // Basic scroll into view logic
        const elementTop = highlightedElement.offsetTop;
        const elementBottom = elementTop + highlightedElement.offsetHeight;
        const containerTop = listElement.scrollTop;
        const containerBottom = containerTop + listElement.offsetHeight;

        if (elementTop < containerTop) {
          listElement.scrollTop = elementTop;
        } else if (elementBottom > containerBottom) {
          listElement.scrollTop = elementBottom - listElement.offsetHeight;
        }
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  // Determine styles based on size
  const heightClass = size === 'sm' ? 'h-10' : 'h-12';
  const paddingClass = size === 'sm' ? 'px-3 py-2 text-[13px]' : 'px-4 py-3 text-[14px]';
  
  let triggerClass = `w-full flex items-center justify-between ${heightClass} ${paddingClass} bg-white border outline-none transition-all cursor-pointer select-none`;
  
  if (size === 'md') {
    triggerClass += ' rounded-xl';
  } else {
    triggerClass += ' rounded-lg'; // slightly smaller radius for small size
  }

  if (disabled || loading) {
    triggerClass += ' bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed';
  } else if (error) {
    triggerClass += ' border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500';
  } else if (isOpen) {
    triggerClass += ' border-[#4648d4] ring-1 ring-[#4648d4]';
  } else {
    triggerClass += ' border-gray-200 hover:border-gray-300';
  }

  return (
    <div className={`relative ${className.includes('w-') ? '' : 'w-full'} ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[13px] font-medium text-[#4648d4] mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Trigger */}
      <div 
        className={triggerClass}
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
          {loading ? 'Loading...' : (selectedOption ? selectedOption.label : placeholder)}
        </span>
        <div className="flex items-center gap-2 text-gray-400 shrink-0">
          {loading && (
            <div className="w-4 h-4 border-2 border-[#4648d4] border-t-transparent rounded-full animate-spin" />
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#4648d4]' : ''}`} />
        </div>
      </div>

      {/* Popover */}
      {isOpen && (
        <div 
          className={`absolute z-50 mt-2 bg-white border border-gray-200/80 rounded-xl shadow-[0_12px_35px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ minWidth: 'max(100%, 220px)', maxWidth: '360px' }}
        >
          
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full h-9 pl-9 pr-4 text-[13px] bg-gray-50 border border-transparent rounded-lg outline-none focus:border-[#4648d4]/40 focus:bg-white transition-colors"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                tabIndex={-1}
              />
            </div>
          </div>

          {/* Options List */}
          <div 
            ref={listboxRef}
            className="max-h-60 overflow-y-auto p-1.5"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px] text-gray-500">
                No results found.
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                let optionClass = "flex items-center justify-between px-3 py-2 text-[13px] rounded-lg cursor-pointer transition-colors";
                
                if (isSelected) {
                  optionClass += " bg-indigo-50/80 text-[#4648d4] font-semibold";
                } else if (isHighlighted) {
                  optionClass += " bg-gray-50 text-gray-900";
                } else {
                  optionClass += " text-gray-700 hover:bg-gray-50";
                }

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={optionClass}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className="truncate pr-3 whitespace-normal font-normal">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 shrink-0 text-[#4648d4]" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
