import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useCart } from "../../context/CartContext";

import ShopLayout from "../../components/shop-now/layout/ShopLayout";
import ShopToolbar from "../../components/shop-now/layout/ShopToolbar";
import FilterSidebar from "../../components/shop-now/filters/FilterSidebar";
import ProductGrid from "../../components/shop-now/product/ProductGrid";
import Pagination from "../../components/shop-now/pagination/Pagination";
import ShopLoader from "../../components/shop-now/loading/ShopLoader";
import EmptyState from "../../components/shop-now/product/EmptyState";

const api = axios.create({
  baseURL: "",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [limit, setLimit] = useState(12);

  const [departmentsList, setDepartmentsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [colorsList, setColorsList] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();

  const [activeDepartment, setActiveDepartment] = useState(searchParams.get("department") || "all");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");

  useEffect(() => {
    const newDept = searchParams.get("department") || "all";
    const newCat = searchParams.get("category") || "all";
    if (newCat !== activeCategory) {
      setActiveColors([]);
    }
    setActiveDepartment(newDept);
    setActiveCategory(newCat);
  }, [searchParams]);
  const [activeBrands, setActiveBrands] = useState([]);
  const [activeColors, setActiveColors] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  const [sort, setSort] = useState("newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const searchQuery = searchParams.get("search") || "";

  const { updateCartCount } = useCart();

  useEffect(() => {
    fetchDepartments();
    fetchCartCount();
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, [activeDepartment, departmentsList]);

  useEffect(() => {
    fetchColors();
  }, [activeDepartment, activeCategory]);

  useEffect(() => {
    fetchProducts();
  }, [activeDepartment, activeCategory, activeBrands, activeColors, priceRange, currentPage, limit, sort, searchQuery]);

  const fetchCartCount = async () => {
    try {
      const res = await api.get("/cart");
      if (res.data.success) {
        updateCartCount(res.data.data.itemCount);
      }
    } catch (err) {
      updateCartCount(0);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      if (res.data.success) {
        setDepartmentsList(res.data.departments || []);
      }
    } catch (err) {
      console.error("Failed to load departments");
    }
  };

  const fetchCategories = async () => {
    try {
      let url = "/categories";
      if (activeDepartment !== "all" && departmentsList.length > 0) {
        const dept = departmentsList.find(d => d.name.toLowerCase() === activeDepartment.toLowerCase());
        if (dept) url = `/categories/department/${dept._id}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setCategoriesList(res.data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories");
    }
  };

  const fetchBrands = async () => {
    try {
      let url = "/brands?limit=1000";
      if (activeDepartment !== "all" && departmentsList.length > 0) {
        const dept = departmentsList.find(d => d.name.toLowerCase() === activeDepartment.toLowerCase());
        if (dept) url = `/brands/department/${dept._id}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setBrandsList(res.data.brands || []);
      }
    } catch (err) {
      console.error("Failed to load brands");
    }
  };

  const fetchColors = async () => {
    try {
      const params = new URLSearchParams();
      if (activeDepartment && activeDepartment !== "all") {
        params.append("department", activeDepartment);
      }
      if (activeCategory && activeCategory !== "all") {
        params.append("category", activeCategory);
      }
      const res = await api.get(`/attribute-options?${params.toString()}`);
      if (res.data.success) {
        const allOptions = res.data.options || [];
        const colorOpts = allOptions.filter(opt =>
          opt.attribute?.name?.toLowerCase() === "color" ||
          opt.attribute?.name?.toLowerCase() === "color / shade" ||
          opt.attribute?.name?.toLowerCase() === "shade" ||
          opt.hex !== undefined
        );
        setColorsList(colorOpts);
      }
    } catch (err) {
      console.error("Failed to load colors");
      setColorsList([]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", limit);
      params.append("sort", sort);

      if (activeDepartment !== "all") {
        params.append("departments", activeDepartment);
      }
      if (activeCategory !== "all") {
        params.append("categories", activeCategory);
      }
      if (activeBrands.length > 0) {
        params.append("brands", activeBrands.join(","));
      }
      if (activeColors.length > 0) {
        params.append("colors", activeColors.join(","));
      }
      if (priceRange.min !== "") {
        params.append("minPrice", priceRange.min);
      }
      if (priceRange.max !== "") {
        params.append("maxPrice", priceRange.max);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        const data = res.data.data;
        setProducts(data.products || []);

        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
          setTotalProducts(data.pagination.total || 0);
        } else {
          setTotalPages(1);
          setTotalProducts(data.products?.length || 0);
        }
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (deptName) => {
    setActiveDepartment(deptName);
    setActiveCategory("all");
    setActiveBrands([]);
    setActiveColors([]);
    setCurrentPage(1);

    const newParams = new URLSearchParams(searchParams);
    if (deptName === "all") {
      newParams.delete("department");
    } else {
      newParams.set("department", deptName);
    }
    newParams.delete("category");
    setSearchParams(newParams);
  };

  const handleCategoryChange = (catName) => {
    setActiveCategory(catName);
    setActiveColors([]);
    setCurrentPage(1);

    const newParams = new URLSearchParams(searchParams);
    if (catName === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", catName);
    }
    setSearchParams(newParams);
  };

  const handleBrandChange = (brands) => {
    setActiveBrands(brands);
    setCurrentPage(1);
  };

  const handlePriceChange = (range) => {
    setPriceRange(range);
    setCurrentPage(1);
  };

  const handleColorChange = (colors) => {
    setActiveColors(colors);
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setActiveDepartment("all");
    setActiveCategory("all");
    setActiveBrands([]);
    setActiveColors([]);
    setPriceRange({ min: "", max: "" });
    setCurrentPage(1);

    setSearchParams({});
  };

  const activeCategoryDoc = categoriesList.find(c => 
    c.name?.toLowerCase() === activeCategory.toLowerCase() || 
    c.slug?.toLowerCase() === activeCategory.toLowerCase()
  );
  const isColorFilterVisible = activeCategory === "all" 
    ? colorsList.length > 0 
    : (activeCategoryDoc ? activeCategoryDoc.hasColors && colorsList.length > 0 : colorsList.length > 0);

  return (
    <ShopLayout
      isMobileFilterOpen={isMobileFilterOpen}
      setIsMobileFilterOpen={setIsMobileFilterOpen}
      sidebar={
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-none shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 transition-all duration-300 max-h-[calc(100vh-80px)] overflow-y-auto">
          <FilterSidebar
            departments={departmentsList}
            activeDepartment={activeDepartment}
            onDepartmentChange={handleDepartmentChange}

            categories={categoriesList}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}

            brands={brandsList}
            activeBrands={activeBrands}
            onBrandChange={handleBrandChange}

            priceRange={priceRange}
            onPriceChange={handlePriceChange}

            colors={isColorFilterVisible ? colorsList : []}
            activeColors={isColorFilterVisible ? activeColors : []}
            onColorChange={handleColorChange}

            onClearAll={handleClearAll}
          />
        </div>
      }
    >
      <div className="bg-[#FFFFFF] border-0 lg:border border-[#E5E7EB] rounded-none shadow-none lg:shadow-[0_2px_10px_rgba(0,0,0,0.02)] min-h-[300px] lg:min-h-[600px] pt-1.5 pb-4 px-2 sm:px-3 lg:pt-2 lg:pb-5 lg:px-4 transition-all duration-300 flex flex-col">
        {!loading && !error && products.length > 0 && (
          <ShopToolbar
            sort={sort}
            onSortChange={(e) => setSort(e.target.value)}
            onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
          />
        )}

        <div className="flex-1">
          {loading ? (
            <ShopLoader />
          ) : error ? (
            <div className="text-center py-20 text-red-500">{error}</div>
          ) : products.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <ProductGrid
                paginatedProducts={products}
                activeColors={isColorFilterVisible ? activeColors : []}
                priceRange={priceRange}
                sort={sort}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </ShopLayout>
  );
};

export default ProductsPage;
