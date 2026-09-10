import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster, ToastBar, toast, resolveValue } from "react-hot-toast";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import PageNotFound from "./components/common/PageNotFound";
import PageLoader from "./components/common/PageLoader";
import AdminUserDetailsPage from "./pages/admin/Users/AdminUserDetailsPage";

import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

import SmoothScrollProvider from "./animation/globalanimation/scroll/SmoothScrollProvider";
import SmoothScrollbar from "./animation/globalanimation/scroll/SmoothScrollbar";

import { lazy, Suspense, useEffect } from "react";

const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search]);
  return null;
};

// Dynamic imports for pages
const Home = lazy(() => import("./pages/home/Home"));
const SignIn = lazy(() => import("./pages/user/SignIn"));
const SignUp = lazy(() => import("./pages/user/SignUp"));
const AdminSignInPage = lazy(() => import("./pages/admin/auth/AdminSignInPage"));
const ChangePasswordPage = lazy(() => import("./pages/user/ChangePasswordPage"));
const ForgotPasswordPage = lazy(() => import("./pages/user/ForgotPasswordPage"));
const Products = lazy(() => import("./pages/shop-now/ProductsPage"));
const ProductDetailsPage = lazy(() => import("./pages/product-details/ProductDetailsPage"));
const Bag = lazy(() => import("./pages/bag/Bag"));
const Address = lazy(() => import("./pages/checkout/Address"));
const Payment = lazy(() => import("./pages/checkout/Payment"));
const WishlistPage = lazy(() => import("./pages/wishlist/WishlistPage"));
const MyAccount = lazy(() => import("./pages/account/MyAccount"));
const OrderDetails = lazy(() => import("./components/account/orders/orderdetails/OrderDetails"));
const ReturnExchangeRequest = lazy(() => import("./components/account/orders/returnexchange/ReturnExchangeRequest"));

// Admin Layout & Pages
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard/Dashboard"));
const CatalogLayout = lazy(() => import("./pages/admin/Catalog/CatalogLayout"));
const DepartmentsList = lazy(() => import("./pages/admin/Catalog/DepartmentsModule/DepartmentsList"));
const AddDepartment = lazy(() => import("./pages/admin/Catalog/DepartmentsModule/AddDepartment"));
const EditDepartment = lazy(() => import("./pages/admin/Catalog/DepartmentsModule/EditDepartment"));
const DepartmentTreeView = lazy(() => import("./pages/admin/Catalog/DepartmentsModule/DepartmentTreeView"));
const CategoriesList = lazy(() => import("./pages/admin/Catalog/CategoriesModule/CategoriesList"));
const AddCategory = lazy(() => import("./pages/admin/Catalog/CategoriesModule/AddCategory"));
const EditCategory = lazy(() => import("./pages/admin/Catalog/CategoriesModule/EditCategory"));

const BrandsList = lazy(() => import("./pages/admin/Catalog/BrandsModule/BrandsList"));
const AddBrand = lazy(() => import("./pages/admin/Catalog/BrandsModule/AddBrand"));
const EditBrand = lazy(() => import("./pages/admin/Catalog/BrandsModule/EditBrand"));
const AttributesList = lazy(() => import("./pages/admin/Catalog/AttributesModule/AttributesList"));
const AddAttribute = lazy(() => import("./pages/admin/Catalog/AttributesModule/AddAttribute"));
const EditAttribute = lazy(() => import("./pages/admin/Catalog/AttributesModule/EditAttribute"));
const ProductsList = lazy(() => import("./pages/admin/Catalog/ProductsModule/ProductsList"));
const AddProduct = lazy(() => import("./pages/admin/Catalog/ProductsModule/AddProduct"));
const EditProduct = lazy(() => import("./pages/admin/Catalog/ProductsModule/EditProduct"));
const ProductVariants = lazy(() => import("./pages/admin/Catalog/ProductsModule/ProductVariants"));
const ProductView = lazy(() => import("./pages/admin/Catalog/ProductsModule/ProductView/ProductView"));
const VariantGroupView = lazy(() => import("./pages/admin/Catalog/ProductsModule/VariantGroupView"));

const StockManagement = lazy(() => import("./pages/admin/StockManagement/StockManagement"));
const Orders = lazy(() => import("./pages/admin/Orders/Orders"));
const Users = lazy(() => import("./pages/admin/Users/Users"));
const Coupons = lazy(() => import("./pages/admin/Coupons/Coupons"));
const Reviews = lazy(() => import("./pages/admin/Reviews/Reviews"));
const Returns = lazy(() => import("./pages/admin/Returns/Returns"));
const AdminTickets = lazy(() => import("./pages/admin/Tickets/Tickets"));
const AdminCaseDetailsPage = lazy(() => import("./pages/admin/CaseDetails/AdminCaseDetailsPage"));

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="w-10 h-10 border-4 border-[#FD7100] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/signin" state={{ from: location }} replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/" replace />;

  return children;
};

// ============================================
// USER LAYOUT
// ============================================
const UserLayout = ({ children }) => {
  const location = useLocation();
  const hideFooterPaths = ["/signin", "/signup", "/admin-login"];
  const showFooter = !hideFooterPaths.includes(location.pathname) && !location.pathname.startsWith("/account");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      {/* REMOVED pt-16 — content starts at top, navbar overlays it */}
      <main className="grow">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};


// ============================================
// ROUTES CONFIGURATION
// ============================================
const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <UserLayout>
            <SmoothScrollProvider>
              <SmoothScrollbar />
              <Home />
            </SmoothScrollProvider>
          </UserLayout>
        }
      />
      <Route
        path="/home"
        element={<Navigate to="/" replace />}
      />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/admin-login" element={<AdminSignInPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <UserLayout>
              <ChangePasswordPage />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <UserLayout>
            <Products />
          </UserLayout>
        }
      />
      <Route
        path="/product/:slug"
        element={
          <UserLayout>
            <ProductDetailsPage />
          </UserLayout>
        }
      />
      <Route
        path="/wishlist"
        element={
          <ProtectedRoute>
            <UserLayout>
              <WishlistPage />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-arrivals"
        element={
          <ProtectedRoute>
            <UserLayout>
              <div className="pt-20 p-8 text-center">
                New Arrivals Page Coming Soon
              </div>
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/bag"
        element={
          <ProtectedRoute>
            <UserLayout>
              <Bag />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/checkout/address"
        element={
          <ProtectedRoute>
            <UserLayout>
              <Address />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/checkout/payment"
        element={
          <ProtectedRoute>
            <UserLayout>
              <Payment />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/orders/:orderId"
        element={
          <ProtectedRoute>
            <UserLayout>
              <OrderDetails />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/orders/:orderId/return/:productId"
        element={
          <ProtectedRoute>
            <UserLayout>
              <ReturnExchangeRequest />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/account"
        element={<Navigate to="/account/profile" replace />}
      />
      <Route
        path="/account/:tab"
        element={
          <ProtectedRoute>
            <UserLayout>
              <MyAccount />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Dashboard - Route Based Architecture */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect to dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />

        {/* Dedicated Catalog Workspace */}
        <Route path="catalog" element={<CatalogLayout />}>
          <Route index element={<Navigate to="departments" replace />} />
          <Route path="departments">
            <Route index element={<DepartmentsList />} />
            <Route path="add" element={<AddDepartment />} />
            <Route path=":id/edit" element={<EditDepartment />} />
            <Route path=":id/tree" element={<DepartmentTreeView />} />
          </Route>
          <Route path="categories">
            <Route index element={<CategoriesList />} />
            <Route path="add" element={<AddCategory />} />
            <Route path=":id/edit" element={<EditCategory />} />

          </Route>
          <Route path="brands">
            <Route index element={<BrandsList />} />
            <Route path="add" element={<AddBrand />} />
            <Route path=":id/edit" element={<EditBrand />} />
          </Route>
          <Route path="attributes">
            <Route index element={<AttributesList />} />
            <Route path="add" element={<AddAttribute />} />
            <Route path=":id/edit" element={<EditAttribute />} />
          </Route>

        </Route>

        {/* Products Module */}
        <Route path="products">
          <Route index element={<ProductsList />} />
          <Route path="add" element={<AddProduct />} />
          <Route path=":id/edit" element={<EditProduct />} />
          <Route path=":id/view" element={<ProductView />} />
          <Route path=":id/variants" element={<ProductVariants />} />
          <Route path=":id/variant-group/:primaryOptionId/view" element={<VariantGroupView />} />
        </Route>

        <Route path="stock-management" element={<StockManagement />} />
        <Route path="orders">
          <Route index element={<Orders />} />
          <Route path=":id" element={<AdminCaseDetailsPage />} />
        </Route>
        <Route path="returns">
          <Route index element={<Returns />} />
          <Route path=":id" element={<AdminCaseDetailsPage />} />
        </Route>
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<AdminUserDetailsPage />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="reviews" element={<Reviews />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster
          position="top-right"
          containerStyle={{
            top: 76,
            right: 20,
            zIndex: 99999,
          }}
          gutter={12}
          toastOptions={{
            duration: 4000,
            success: {
              duration: 4000,
            },
            error: {
              duration: 5000,
            },
          }}
        >
          {(t) => {
            const isError = t.type === "error";
            const isSuccess = t.type === "success";
            const isLoading = t.type === "loading";

            const toastDuration = t.duration || (isError ? 5000 : 4000);

            const accentColor = isError
              ? "#ef4444"
              : isSuccess
              ? "#10b981"
              : isLoading
              ? "#3b82f6"
              : "#FD7100";

            const iconBg = isError
              ? "bg-red-100 text-red-600"
              : isSuccess
              ? "bg-emerald-100 text-emerald-600"
              : isLoading
              ? "bg-blue-100 text-blue-600"
              : "bg-orange-100 text-[#FD7100]";

            const borderColor = isError
              ? "#fecaca"
              : isSuccess
              ? "#a7f3d0"
              : isLoading
              ? "#bfdbfe"
              : "#fed7aa";

            return (
              <ToastBar
                toast={t}
                position={t.position || "top-right"}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  padding: "13px 15px",
                  borderRadius: "14px",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                  border: `1px solid ${borderColor}`,
                  borderLeft: `5px solid ${accentColor}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  maxWidth: "420px",
                  minWidth: "290px",
                }}
              >
                {() => (
                  <div className="flex flex-col w-full">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${iconBg} shadow-xs`}
                        >
                          {isError ? (
                            <AlertCircle size={18} strokeWidth={2.5} />
                          ) : isSuccess ? (
                            <CheckCircle2 size={18} strokeWidth={2.5} />
                          ) : isLoading ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Info size={18} strokeWidth={2.5} />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 text-[13.5px] font-semibold text-slate-800 leading-snug">
                        {resolveValue(t.message, t)}
                      </div>
                      {!isLoading && (
                        <button
                          type="button"
                          onClick={() => toast.dismiss(t.id)}
                          className="flex-shrink-0 text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
                          aria-label="Close notification"
                        >
                          <X size={15} strokeWidth={2.2} />
                        </button>
                      )}
                    </div>
                    {!isLoading && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100/90 overflow-hidden"
                        style={{ borderRadius: "0 0 14px 14px" }}
                      >
                        <div
                          className="h-full"
                          style={{
                            backgroundColor: accentColor,
                            animation: `toast-progress ${toastDuration}ms linear forwards`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </ToastBar>
            );
          }}
        </Toaster>
        <WishlistProvider>
          <Router>
            <ScrollToTop />
            <AppRoutes />
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
