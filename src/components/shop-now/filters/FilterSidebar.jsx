import DepartmentFilter from "./DepartmentFilter";
import CategoryFilters from "./CategoryFilters";
import BrandFilter from "./BrandFilter";
import PriceFilter from "./PriceFilter";
import ColorFilter from "./ColorFilter";

const FilterSidebar = ({ 
  departments, activeDepartment, onDepartmentChange,
  categories, activeCategory, onCategoryChange,
  brands, activeBrands, onBrandChange,
  priceRange, onPriceChange,
  colors, activeColors, onColorChange,
  onClearAll
}) => {
  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#111827] font-bold text-lg">Filters</h2>
        <button 
          onClick={onClearAll}
          className="text-[#FD7100] text-[15px] font-semibold hover:underline"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-col">
        <DepartmentFilter 
          departments={departments}
          activeDepartment={activeDepartment}
          onChange={onDepartmentChange}
        />
        <CategoryFilters 
          categories={categories} 
          activeCategory={activeCategory} 
          onChange={onCategoryChange} 
        />
        <BrandFilter 
          brands={brands}
          activeBrands={activeBrands}
          onChange={onBrandChange}
        />
        <ColorFilter 
          colors={colors}
          activeColors={activeColors}
          onChange={onColorChange}
        />
        <PriceFilter 
          priceRange={priceRange}
          onChange={onPriceChange}
        />
      </div>
    </div>
  );
};

export default FilterSidebar;
