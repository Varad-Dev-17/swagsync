import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.PROD ? "" : "http://localhost:8000"),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Detect vendor account suspension
    const isSuspended =
      status === 403 &&
      (data?.vendorStatus === "SUSPENDED" ||
        (typeof data?.message === "string" &&
          data.message.toLowerCase().includes("suspended")));

    if (isSuspended) {
      localStorage.removeItem("token");
      localStorage.removeItem("profileImage");

      window.dispatchEvent(
        new CustomEvent("vendor:suspended", {
          detail: {
            message:
              data?.message ||
              "Your Vendor account has been suspended by Admin. Please contact support.",
          },
        })
      );

      const pathname = window.location.pathname;
      if (
        pathname.startsWith("/vendor") &&
        pathname !== "/vendor/login" &&
        pathname !== "/vendor/register"
      ) {
        const reason = encodeURIComponent(
          data?.message ||
            "Your Vendor account has been suspended by Admin. Please contact support."
        );
        window.location.replace(`/vendor/login?suspended=true&reason=${reason}`);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
