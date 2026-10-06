import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axiosConfig";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSuspendedEvent = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("profileImage");
      setUser(null);
    };
    window.addEventListener("vendor:suspended", handleSuspendedEvent);

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          localStorage.removeItem("profileImage");
          setUser(null);
          setLoading(false);
        } else {
          const storedProfileImage = localStorage.getItem("profileImage");
          const initialUser = {
            userId: payload.userId,
            email: payload.email,
            username: payload.username,
            isAdmin: payload.isAdmin,
            role: payload.role || (payload.isAdmin ? "admin" : "customer"),
            vendorStatus: payload.vendorStatus,
            vendorId: payload.vendorId,
            storeName: payload.storeName,
            profileImage: storedProfileImage ? JSON.parse(storedProfileImage) : payload.profileImage,
            mobileNo: payload.mobileNo,
            dateOfBirth: payload.dateOfBirth,
            gender: payload.gender,
            token,
          };
          setUser(initialUser);

          // If vendor, perform real-time status verification against the server
          if (payload.role === "vendor") {
            api.get("/vendor/me")
              .then((res) => {
                if (res.data?.success && res.data?.vendor) {
                  const freshVendor = res.data.vendor;
                  if (freshVendor.vendorStatus !== "APPROVED") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("profileImage");
                    setUser(null);
                    if (window.location.pathname.startsWith("/vendor") && window.location.pathname !== "/vendor/login") {
                      const reason = encodeURIComponent(
                        freshVendor.vendorStatus === "SUSPENDED"
                          ? "Your Vendor account has been suspended by Admin. Please contact support."
                          : `Your Vendor account status is ${freshVendor.vendorStatus}.`
                      );
                      window.location.replace(`/vendor/login?suspended=true&reason=${reason}`);
                    }
                  } else {
                    setUser((prev) =>
                      prev
                        ? {
                            ...prev,
                            vendorStatus: freshVendor.vendorStatus,
                            storeName: freshVendor.vendorProfile?.storeName || prev.storeName,
                          }
                        : null
                    );
                  }
                }
              })
              .catch((err) => {
                const isSuspended =
                  err.response?.status === 403 &&
                  (err.response?.data?.vendorStatus === "SUSPENDED" ||
                    (typeof err.response?.data?.message === "string" &&
                      err.response.data.message.toLowerCase().includes("suspended")));
                if (isSuspended) {
                  localStorage.removeItem("token");
                  localStorage.removeItem("profileImage");
                  setUser(null);
                  if (window.location.pathname.startsWith("/vendor") && window.location.pathname !== "/vendor/login") {
                    const reason = encodeURIComponent(
                      err.response?.data?.message ||
                        "Your Vendor account has been suspended by Admin. Please contact support."
                    );
                    window.location.replace(`/vendor/login?suspended=true&reason=${reason}`);
                  }
                }
              })
              .finally(() => {
                setLoading(false);
              });
            return () => {
              window.removeEventListener("vendor:suspended", handleSuspendedEvent);
            };
          } else {
            setLoading(false);
          }
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("profileImage");
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener("vendor:suspended", handleSuspendedEvent);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/signin", { email, password });
      if (response.data.success) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.profileImage) {
          localStorage.setItem("profileImage", JSON.stringify(payload.profileImage));
        } else {
          localStorage.removeItem("profileImage");
        }
        setUser({
          userId: payload.userId,
          email: payload.email,
          username: payload.username,
          isAdmin: payload.isAdmin,
          profileImage: payload.profileImage,
          mobileNo: payload.mobileNo,
          dateOfBirth: payload.dateOfBirth,
          gender: payload.gender,
          token,
        });
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Something went wrong",
      };
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const response = await api.post("/admin/signin", { email, password });
      if (response.data.success) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          userId: payload.userId,
          email: payload.email,
          username: payload.username,
          isAdmin: payload.isAdmin,
          token,
        });
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Something went wrong",
      };
    }
  };

  const vendorLogin = async (email, password) => {
    try {
      const response = await api.post("/vendor/login", { email, password });
      if (response.data.success) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          userId: payload.userId,
          email: payload.email,
          username: payload.username,
          isAdmin: false,
          role: "vendor",
          vendorStatus: payload.vendorStatus,
          vendorId: payload.vendorId,
          storeName: payload.storeName,
          token,
        });
        return { success: true, vendor: response.data.vendor };
      }
      return {
        success: false,
        message: response.data.message,
        vendorStatus: response.data.vendorStatus,
        needsVerification: response.data.needsVerification,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to log in as vendor",
        vendorStatus: err.response?.data?.vendorStatus,
        needsVerification: err.response?.data?.needsVerification,
        email: err.response?.data?.email,
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/signout");
    } catch (err) {
      console.log("Signout error:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("profileImage");
    setUser(null);
  };

  const sendForgotPasswordCode = async (email) => {
    try {
      const response = await api.patch("/auth/send-forgot-password-code", {
        email,
      });
      return {
        success: true,
        message: response.data.message,
        code: response.data.code,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to send code",
      };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      const response = await api.patch("/auth/change-password", {
        oldPassword,
        newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to change password",
      };
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const updateProfilePhoto = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.patch("/auth/profile-photo", formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        const newProfileImage = response.data.profileImage;
        localStorage.setItem("profileImage", JSON.stringify(newProfileImage));
        setUser((prev) => ({ ...prev, profileImage: newProfileImage }));
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to update profile photo",
      };
    }
  };

  const removeProfilePhoto = async () => {
    try {
      const response = await api.delete("/auth/profile-photo", {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        localStorage.removeItem("profileImage");
        setUser((prev) => ({ ...prev, profileImage: null }));
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to remove profile photo",
      };
    }
  };

  const updateProfileInfo = async (data) => {
    try {
      const response = await api.patch("/auth/profile-info", data, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        const newToken = response.data.token;
        localStorage.setItem("token", newToken);
        const payload = JSON.parse(atob(newToken.split(".")[1]));
        setUser((prev) => ({
          ...prev,
          username: payload.username,
          email: payload.email,
          mobileNo: payload.mobileNo,
          dateOfBirth: payload.dateOfBirth,
          gender: payload.gender,
          token: newToken,
        }));
        return { success: true, message: response.data.message, emailChanged: response.data.emailChanged };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to update profile info",
      };
    }
  };

  const verifyEmailChange = async (email, codeProvided) => {
    try {
      const response = await api.patch("/auth/verify-verification-code", {
        email,
        codeProvided,
      });

      if (response.data.success) {
        const newToken = response.data.token;
        if (newToken) {
          localStorage.setItem("token", newToken);
          const payload = JSON.parse(atob(newToken.split(".")[1]));
          setUser((prev) => ({
            ...prev,
            verified: payload.verified,
            token: newToken,
          }));
        }
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Verification failed",
      };
    }
  };

  const sendVendorForgotPasswordCode = async (email) => {
    try {
      const response = await api.post("/vendor/send-forgot-password-code", {
        email,
      });
      return {
        success: true,
        message: response.data.message,
        code: response.data.code,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to send reset code",
      };
    }
  };

  const verifyVendorForgotPasswordCode = async (email, providedCode, newPassword) => {
    try {
      const response = await api.post("/vendor/verify-forgot-password-code", {
        email,
        providedCode,
        newPassword,
      });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to reset password",
      };
    }
  };

  const changeVendorPassword = async (oldPassword, newPassword) => {
    try {
      const response = await api.patch(
        "/vendor/change-password",
        { oldPassword, newPassword },
        getAuthHeaders()
      );
      return { success: true, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to change password",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        adminLogin,
        vendorLogin,
        sendVendorForgotPasswordCode,
        verifyVendorForgotPasswordCode,
        changeVendorPassword,
        logout,
        loading,
        getAuthHeaders,
        changePassword,
        updateProfilePhoto,
        removeProfilePhoto,
        updateProfileInfo,
        verifyEmailChange,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
