import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Clock,
  AlertCircle,
  Check,
  X,
  FileCheck,
  UploadCloud,
  Users,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axiosConfig";

const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership Firm",
  "Limited Liability Partnership (LLP)",
  "Private Limited Company (Pvt Ltd)",
  "Public Limited Company",
  "One Person Company (OPC)",
  "Other",
];

const REQUIRED_DOCUMENTS = [
  {
    key: "gst",
    name: "GST Certificate",
    required: false,
    desc: "Certificate issued by GST authority (PDF/Image)",
  },
  {
    key: "pan",
    name: "PAN Card",
    required: true,
    desc: "Company or Proprietor PAN copy",
  },
  {
    key: "business_proof",
    name: "Business Registration Proof",
    required: true,
    desc: "MSME, Udyam, or Certificate of Incorporation",
  },
  {
    key: "bank_proof",
    name: "Bank Account Proof",
    required: true,
    desc: "Cancelled cheque or bank account statement",
  },
];

const STEPS = [
  { id: 1, label: "Personal & Store" },
  { id: 2, label: "Address & Business" },
  { id: 3, label: "Bank & Documents" },
];

const VendorRegister = () => {
  // View mode: "form" | "verify" | "success"
  const [viewMode, setViewMode] = useState("form");
  // Multi-step form: 1 to 3
  const [currentStep, setCurrentStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal & Store Information
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    storeName: "",
    storeDescription: "",

    // Step 2: Address & Business Information
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    businessName: "",
    businessType: "Sole Proprietorship",
    gstNumber: "",
    panNumber: "",
    sameAsStoreInfo: true,
    manufacturerName: "",
    countryOfOrigin: "India",
    mfgAddress: "",
    packer: "",
    packerPhone: "",
    packerAddress: "",

    // Step 3: Bank & Documents
    accountHolderName: "",
    bankName: "",
    ifscCode: "",
    accountNumber: "",
    confirmAccountNumber: "",
  });

  // Documents state: list of { key, name, url, publicId, fileType }
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [uploadingDocKey, setUploadingDocKey] = useState(null);

  // OTP Verification state
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const resolvedValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: resolvedValue }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Upload Document Handler (Cloudinary integration)
  const handleFileUpload = async (docKey, docName, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF and JPG/PNG/WEBP files are accepted.");
      return;
    }

    setUploadingDocKey(docKey);
    const data = new FormData();
    data.append("document", file);

    try {
      const res = await api.post("/vendor/upload-document", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success(`${docName} uploaded!`);
        setUploadedDocuments((prev) => [
          ...prev.filter((d) => d.key !== docKey),
          {
            key: docKey,
            name: docName,
            url: res.data.data.url,
            publicId: res.data.data.publicId,
            fileType: res.data.data.fileType,
          },
        ]);
        if (errors[docKey]) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[docKey];
            return next;
          });
        }
      }
    } catch (err) {
      console.error("Document upload failed:", err);
      toast.error(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingDocKey(null);
    }
  };

  const handleRemoveDoc = (docKey) => {
    setUploadedDocuments((prev) => prev.filter((d) => d.key !== docKey));
  };

  // Step validation
  const validateCurrentStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      // Step 1: Personal & Store Information
      if (!formData.fullName.trim()) {
        newErrors.fullName = "Full name is required";
      } else if (formData.fullName.trim().length < 2) {
        newErrors.fullName = "Full name must be at least 2 characters";
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        newErrors.email = "Email address is required";
      } else if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }

      const cleanPhone = formData.phone.trim();
      if (!cleanPhone) {
        newErrors.phone = "Phone number is required";
      } else if (!/^[0-9]{10}$/.test(cleanPhone.replace(/[\s+-]/g, "").slice(-10))) {
        newErrors.phone = "Please enter a valid 10-digit mobile number";
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (!passwordRegex.test(formData.password)) {
        newErrors.password = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Confirm password is required";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (!formData.storeName.trim()) {
        newErrors.storeName = "Store name is required";
      } else if (formData.storeName.trim().length < 2) {
        newErrors.storeName = "Store name must be at least 2 characters";
      }
    } else if (stepNumber === 2) {
      // Step 2: Address & Business Information
      if (!formData.addressLine1.trim()) {
        newErrors.addressLine1 = "Address Line 1 is required";
      } else if (formData.addressLine1.trim().length < 3) {
        newErrors.addressLine1 = "Address Line 1 must be at least 3 characters";
      }

      if (!formData.city.trim()) {
        newErrors.city = "City is required";
      }

      if (!formData.state.trim()) {
        newErrors.state = "State is required";
      }

      const pin = formData.pincode.trim();
      if (!pin) {
        newErrors.pincode = "Pincode is required";
      } else if (!/^[0-9]{4,10}$/.test(pin)) {
        newErrors.pincode = "Please enter a valid pincode";
      }

      if (!formData.businessName.trim()) {
        newErrors.businessName = "Business / Entity legal name is required";
      }

      if (!formData.businessType) {
        newErrors.businessType = "Please select a business type";
      }

      const pan = formData.panNumber.trim().toUpperCase();
      if (!pan) {
        newErrors.panNumber = "PAN number is required";
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        newErrors.panNumber = "Invalid PAN format (e.g. ABCDE1234F)";
      }

      if (formData.gstNumber.trim()) {
        const gst = formData.gstNumber.trim().toUpperCase();
        if (gst.length !== 15) {
          newErrors.gstNumber = "GSTIN must be 15 characters long";
        }
      }
    } else if (stepNumber === 3) {
      // Step 3: Bank & Documents
      if (!formData.accountHolderName.trim()) {
        newErrors.accountHolderName = "Account holder name is required";
      }

      if (!formData.bankName.trim()) {
        newErrors.bankName = "Bank name is required";
      }

      const ifsc = formData.ifscCode.trim().toUpperCase();
      if (!ifsc) {
        newErrors.ifscCode = "IFSC code is required";
      } else if (ifsc.length !== 11) {
        newErrors.ifscCode = "IFSC code must be exactly 11 characters (e.g. HDFC0001234)";
      }

      if (!formData.accountNumber.trim()) {
        newErrors.accountNumber = "Account number is required";
      } else if (formData.accountNumber.trim().length < 6) {
        newErrors.accountNumber = "Account number must be at least 6 digits";
      }

      if (!formData.confirmAccountNumber.trim()) {
        newErrors.confirmAccountNumber = "Please confirm your account number";
      } else if (formData.accountNumber.trim() !== formData.confirmAccountNumber.trim()) {
        newErrors.confirmAccountNumber = "Account numbers do not match";
      }

      // Check mandatory document uploads
      const missingDocs = REQUIRED_DOCUMENTS.filter(
        (rd) => rd.required && !uploadedDocuments.some((ud) => ud.key === rd.key)
      );

      if (missingDocs.length > 0) {
        newErrors.documents = `Please upload mandatory document: ${missingDocs[0].name}`;
      }
    }

    setErrors(newErrors);

    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      toast.error(newErrors[errorKeys[0]]);
      return false;
    }

    return true;
  };

  // Step Navigation: Next
  const handleNextStep = () => {
    if (validateCurrentStep(currentStep)) {
      setErrors({});
      setCurrentStep((prev) => Math.min(3, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Step Navigation: Back (Preserves all entered data)
  const handlePrevStep = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Jump to previously completed step
  const handleJumpToStep = (targetStep) => {
    if (targetStep < currentStep) {
      setErrors({});
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Final Registration Submission (Triggers after Step 3)
  const handleSubmitRegistration = async (e) => {
    if (e) e.preventDefault();

    // Validate Step 3
    if (!validateCurrentStep(3)) return;

    setLoading(true);

    try {
      const resolvedStoreAddress = [
        formData.addressLine1.trim(),
        formData.addressLine2.trim(),
        formData.city.trim(),
        `${formData.state.trim()} - ${formData.pincode.trim()}`,
      ]
        .filter(Boolean)
        .join(", ");

      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        storeName: formData.storeName.trim(),
        storeDescription: formData.storeDescription.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim() || "India",
        pincode: formData.pincode.trim(),
        businessName: formData.businessName.trim(),
        businessType: formData.businessType,
        gstNumber: formData.gstNumber.trim().toUpperCase(),
        panNumber: formData.panNumber.trim().toUpperCase(),
        // Manufacturer & Packer details
        manufacturerName: formData.sameAsStoreInfo
          ? formData.storeName.trim()
          : (formData.manufacturerName.trim() || formData.storeName.trim()),
        countryOfOrigin: formData.countryOfOrigin?.trim() || "India",
        manufacturerAddress: formData.sameAsStoreInfo
          ? resolvedStoreAddress
          : (formData.mfgAddress.trim() || resolvedStoreAddress),
        packer: formData.sameAsStoreInfo
          ? formData.storeName.trim()
          : (formData.packer.trim() || formData.storeName.trim()),
        packerPhone: formData.sameAsStoreInfo
          ? formData.phone.trim()
          : (formData.packerPhone.trim() || formData.phone.trim()),
        packerAddress: formData.sameAsStoreInfo
          ? resolvedStoreAddress
          : (formData.packerAddress.trim() || formData.mfgAddress.trim() || resolvedStoreAddress),
        accountHolderName: formData.accountHolderName.trim(),
        bankName: formData.bankName.trim(),
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        documents: uploadedDocuments.map((d) => ({
          name: d.name,
          url: d.url,
          publicId: d.publicId,
          fileType: d.fileType,
        })),
      };

      const res = await api.post("/vendor/register", payload);

      if (res.data.success) {
        toast.success(res.data.message || "Registration submitted! Check email for OTP.");
        setViewMode("verify");
        startResendTimer();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(err.response?.data?.message || "Failed to submit registration");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Timer
  const startResendTimer = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await api.post("/vendor/resend-otp", {
        email: formData.email.trim().toLowerCase(),
      });
      if (res.data.success) {
        toast.success("Verification code resent to your email!");
        startResendTimer();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification code");
    }
  };

  // Verify OTP submission
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanCode = (verificationCode || "").trim();
    if (!cleanCode || cleanCode.length < 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    const email = (formData.email || "").trim().toLowerCase();
    if (!email) {
      toast.error("Email address is missing. Please edit your details.");
      return;
    }

    setVerifyLoading(true);
    try {
      const payload = {
        email,
        codeProvided: cleanCode,
        otp: cleanCode,
      };

      const res = await api.post("/vendor/verify-email", payload);

      if (res.data.success) {
        toast.success(res.data.message || "Email verified successfully!");
        setViewMode("success");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Verification failed:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Invalid or expired verification code";
      toast.error(errorMsg);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="w-full px-6 sm:px-10 lg:px-12 h-16 flex items-center justify-between">
          {/* Left: SwagSync project logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/Logo/logo.png"
              alt="SwagSync"
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Right: Vendor login */}
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm text-slate-600">
              Already a registered vendor?
            </span>
            <Link
              to="/vendor/login"
              className="text-xs sm:text-sm font-semibold text-[#fe4a03] hover:bg-orange-50 px-4 py-1.5 rounded-lg border border-[#fe4a03] transition-colors"
            >
              Vendor Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area: Left Promotional Sidebar + Right Registration Form */}
      {viewMode === "form" && (
        <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
          {/* LEFT SIDEBAR: Promotional Area */}
          <aside className="w-full lg:w-[310px] xl:w-[340px] shrink-0 bg-[#FDF6EC] p-7 sm:p-9 flex flex-col justify-between">
            <div>
              {/* Eyebrow */}
              <span className="text-[11px] font-bold tracking-widest text-[#fe4a03] uppercase block mb-2">
                JOIN SWAGSYNC
              </span>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                Start selling
                <br />
                with SwagSync
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-8">
                Showcase your products to millions of shoppers. Grow your business with our trusted marketplace.
              </p>

              {/* Benefits with round warm badge icons */}
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#FFE6DB] text-[#fe4a03] flex items-center justify-center shrink-0">
                    <Users size={16} className="stroke-[2.2]" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    Reach millions of customers
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#FFE6DB] text-[#fe4a03] flex items-center justify-center shrink-0">
                    <Store size={16} className="stroke-[2.2]" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    Easy product & order management
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#FFE6DB] text-[#fe4a03] flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} className="stroke-[2.2]" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    Secure & timely payments
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom vendor illustration */}
            <div className="mt-8 -mx-7 sm:-mx-9 -mb-7 sm:-mb-9 flex justify-start">
              <img
                src="/vendor/vendor-promo-illustration.png"
                alt="SwagSync Vendor"
                className="w-full max-w-[340px] h-auto object-contain object-bottom"
              />
            </div>
          </aside>

          {/* RIGHT COLUMN: Form Workspace */}
          <main className="flex-1 bg-white px-6 sm:px-12 lg:px-14 py-8 sm:py-9">
            {/* Top Title & Stepper Header */}
            <div className="w-full max-w-2xl ml-6 sm:ml-20 lg:ml-36 xl:ml-44 mb-9">
              {/* Page Header (Centered directly above 3-step progress tracker) */}
              <div className="mb-6 text-center">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Register as a SwagSync Vendor
                </h1>
                {/* <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                  Sell to millions of shoppers. Complete the 3-step application to submit your seller credentials for review.
                </p> */}
              </div>

              {/* 3-STEP PROGRESS INDICATOR */}
              <div className="w-full">
                <div className="flex items-center justify-between relative">
                  {STEPS.map((s) => {
                    const isCompleted = s.id < currentStep;
                    const isCurrent = s.id === currentStep;
                    const isClickable = isCompleted;

                    return (
                      <div
                        key={s.id}
                        onClick={() => isClickable && handleJumpToStep(s.id)}
                        className={`flex flex-col items-center text-center relative z-10 ${
                          isClickable ? "cursor-pointer group" : "cursor-default"
                        }`}
                      >
                        {/* Circle */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCurrent
                              ? "bg-[#fe4a03] text-white ring-4 ring-orange-100 shadow-xs"
                              : isCompleted
                              ? "bg-emerald-600 text-white group-hover:bg-emerald-700"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                          title={isClickable ? `Click to return to Step ${s.id}` : undefined}
                        >
                          {isCompleted ? <Check size={15} className="stroke-[2.5]" /> : s.id}
                        </div>

                        {/* Step Label */}
                        <span
                          className={`text-xs mt-2 transition-colors ${
                            isCurrent
                              ? "text-[#fe4a03] font-bold"
                            : isCompleted
                            ? "text-slate-800 font-medium"
                            : "text-slate-500 font-medium"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}

                {/* Thin connecting lines behind circles */}
                <div className="absolute top-[16px] left-[10%] right-[10%] h-[1.5px] bg-slate-200 z-0">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

            {/* Main Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (currentStep < 3) {
                  handleNextStep();
                } else {
                  handleSubmitRegistration(e);
                }
              }}
            >
              {/* STEP 1: Personal & Store */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Section: Personal Information */}
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Personal Information
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 mb-5">
                      Your direct contact and account access details
                    </p>

                    {/* Row 1 — 3 equal columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                      {/* Full Name */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Amit Kulkarni"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.fullName
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.fullName && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.fullName}
                          </span>
                        )}
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="vam17122@gmail.com"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.email
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.email && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.email}
                          </span>
                        )}
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="9922055257"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.phone
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.phone && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 2 — 2 balanced columns: Password & Confirm Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5">
                      {/* Password */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="VamVendor@1234"
                            className={`w-full h-11 px-3.5 pr-10 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                              errors.password
                                ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.password && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.password}
                          </span>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="••••••••••••"
                            className={`w-full h-11 px-3.5 pr-10 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                              errors.confirmPassword
                                ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.confirmPassword}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section: Store Information */}
                  <div className="mt-8">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Store Information
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 mb-5">
                      Your customer-facing brand & marketplace identity
                    </p>

                    {/* 2 balanced columns: Store Name & Store Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      {/* Store Name */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Store Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="storeName"
                          value={formData.storeName}
                          onChange={handleInputChange}
                          placeholder="Urban Style Hub"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.storeName
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          This is the brand name your customers will see on the marketplace.
                        </span>
                        {errors.storeName && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.storeName}
                          </span>
                        )}
                      </div>

                      {/* Store Description (Optional) */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Store Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          type="text"
                          name="storeDescription"
                          value={formData.storeDescription}
                          onChange={handleInputChange}
                          placeholder="Urban Style Hub"
                          className="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03] text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden"
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Tell customers about your story, catalog, and specialty.
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Address & Business */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Section: Business / Store Address */}
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Business / Store Address
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 mb-5">
                      Official registered location of your business
                    </p>

                    {/* Row 1 — Address Line 1 & Address Line 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Address Line 1 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="addressLine1"
                          value={formData.addressLine1}
                          onChange={handleInputChange}
                          placeholder="Shop No. 24, MG Road"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.addressLine1
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.addressLine1 && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.addressLine1}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Address Line 2 <span className="text-slate-400 font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          type="text"
                          name="addressLine2"
                          value={formData.addressLine2}
                          onChange={handleInputChange}
                          placeholder="Near City Mall"
                          className="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03] text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Row 2 — 3 columns: City, State, Pincode */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Pune"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.city
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.city && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.city}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="Maharashtra"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.state
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.state && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.state}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Pincode / Postal Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          placeholder="411001"
                          maxLength={10}
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.pincode
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.pincode && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.pincode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 3 — Country */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          disabled
                          className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-sm font-medium cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Business & Tax Details */}
                  <div className="mt-8">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Business & Tax Details
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 mb-5">
                      Legal entity information and tax credentials
                    </p>

                    {/* Row 1 — Legal Name & Business Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Business / Entity Legal Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          placeholder="Urban Style Enterprises"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.businessName
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.businessName && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.businessName}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Business Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleInputChange}
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white transition-all outline-hidden ${
                            errors.businessType
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        >
                          {BUSINESS_TYPES.map((bt) => (
                            <option key={bt} value={bt}>
                              {bt}
                            </option>
                          ))}
                        </select>
                        {errors.businessType && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.businessType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 2 — GSTIN & PAN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          GST Number (GSTIN)
                        </label>
                        <input
                          type="text"
                          name="gstNumber"
                          value={formData.gstNumber}
                          onChange={handleInputChange}
                          placeholder="27ABCDE1234F1Z5"
                          maxLength={15}
                          className={`w-full h-11 px-3.5 rounded-lg border uppercase text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.gstNumber
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Optional for unregistered micro-sellers.
                        </span>
                        {errors.gstNumber && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.gstNumber}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          PAN Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="panNumber"
                          value={formData.panNumber}
                          onChange={handleInputChange}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          className={`w-full h-11 px-3.5 rounded-lg border uppercase text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.panNumber
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Company PAN or Proprietor PAN.
                        </span>
                        {errors.panNumber && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.panNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section: Manufacturer & Packer Information */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          Manufacturer & Packer Details
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Required for legal compliance on marketplace product labels
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer bg-orange-50/70 border border-orange-200/80 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 select-none hover:bg-orange-100/60 transition-colors">
                        <input
                          type="checkbox"
                          name="sameAsStoreInfo"
                          checked={formData.sameAsStoreInfo}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-[#fe4a03] border-slate-300 rounded focus:ring-[#fe4a03] accent-[#fe4a03]"
                        />
                        <span>Same as Store & Address</span>
                      </label>
                    </div>

                    {!formData.sameAsStoreInfo && (
                      <div className="space-y-4 sm:space-y-5 bg-slate-50/60 p-4 sm:p-5 rounded-xl border border-slate-200/80 mt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                              Manufacturer Name
                            </label>
                            <input
                              type="text"
                              name="manufacturerName"
                              value={formData.manufacturerName}
                              onChange={handleInputChange}
                              placeholder="e.g. Apex Apparels Pvt Ltd"
                              className="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03] text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                              Country of Origin
                            </label>
                            <input
                              type="text"
                              name="countryOfOrigin"
                              value={formData.countryOfOrigin}
                              onChange={handleInputChange}
                              placeholder="India"
                              className="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03] text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                            Manufacturer Facility Address
                          </label>
                          <input
                            type="text"
                            name="mfgAddress"
                            value={formData.mfgAddress}
                            onChange={handleInputChange}
                            placeholder="Plot 12, Industrial Area, Phase 2, Pune, Maharashtra - 411018"
                            className="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03] text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-2">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                              Packer / Packaging Unit Name
                            </label>
                            <input
                              type="text"
                              name="packer"
                              value={formData.packer}
                              onChange={handleInputChange}
                              placeholder="e.g. Apex Packaging Solutions"
                              className="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03] text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                              Packer Contact Phone
                            </label>
                            <input
                              type="tel"
                              name="packerPhone"
                              value={formData.packerPhone}
                              onChange={handleInputChange}
                              placeholder="e.g. 9876543210"
                              className="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03] text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                            Packer Address
                          </label>
                          <input
                            type="text"
                            name="packerAddress"
                            value={formData.packerAddress}
                            onChange={handleInputChange}
                            placeholder="Same as manufacturer or custom packaging unit address"
                            className="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03] text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Bank & Documents */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Section: Bank / Payout Information */}
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Bank / Payout Information
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 mb-5">
                      Payout settlement details and verified credentials
                    </p>

                    {/* Row 1 — 3 columns: Account Holder, Bank Name, IFSC */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Account Holder Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="accountHolderName"
                          value={formData.accountHolderName}
                          onChange={handleInputChange}
                          placeholder="Amit Kulkarni"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.accountHolderName
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.accountHolderName && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.accountHolderName}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Bank Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleInputChange}
                          placeholder="HDFC Bank"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.bankName
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.bankName && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.bankName}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          IFSC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="ifscCode"
                          value={formData.ifscCode}
                          onChange={handleInputChange}
                          placeholder="HDFC0001234"
                          maxLength={11}
                          className={`w-full h-11 px-3.5 rounded-lg border uppercase text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.ifscCode
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.ifscCode && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.ifscCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 2 — 2 columns: Account Number & Confirm Account Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleInputChange}
                          placeholder="••••••••••••"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.accountNumber
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.accountNumber && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.accountNumber}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Confirm Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="confirmAccountNumber"
                          value={formData.confirmAccountNumber}
                          onChange={handleInputChange}
                          placeholder="Re-enter Account Number"
                          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 transition-all outline-hidden ${
                            errors.confirmAccountNumber
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-slate-200 focus:border-[#fe4a03] focus:ring-1 focus:ring-[#fe4a03]"
                          }`}
                        />
                        {errors.confirmAccountNumber && (
                          <span className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.confirmAccountNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Verified Settlement Informational Callout */}
                    <div className="p-3.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900 flex items-start gap-3 mt-5">
                      <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-emerald-900">
                          Verified Settlement
                        </h4>
                        <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                          Direct vendor disbursements will be wired to this bank account upon invoice approval.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section: Business Verification Documents */}
                  <div className="mt-8">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Business Verification Documents
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 mb-5">
                      Upload official credentials for seller compliance verification
                    </p>

                    {errors.documents && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{errors.documents}</span>
                      </div>
                    )}

                    {/* 2-column grid for document uploads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      {REQUIRED_DOCUMENTS.map((doc) => {
                        const uploaded = uploadedDocuments.find((d) => d.key === doc.key);
                        const isCurrentlyUploading = uploadingDocKey === doc.key;

                        return (
                          <div
                            key={doc.key}
                            className={`p-4 rounded-lg border transition-all ${
                              uploaded
                                ? "border-emerald-200 bg-emerald-50/20"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                                    {doc.name}
                                  </span>
                                  {doc.required ? (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                                      Required
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                      Optional
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {doc.desc}
                                </p>
                              </div>
                            </div>

                            {uploaded ? (
                              <div className="mt-3 flex items-center justify-between gap-2 p-2 rounded-md bg-white border border-emerald-200 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileCheck size={15} className="text-emerald-600 shrink-0" />
                                  <span className="font-medium text-slate-800 truncate">
                                    {uploaded.name} (Uploaded)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(doc.key)}
                                  className="text-slate-400 hover:text-red-600 p-0.5 transition-colors cursor-pointer"
                                  title="Remove document"
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            ) : (
                              <div className="mt-3">
                                <label className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-orange-50/50 hover:border-[#fe4a03] text-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                                  {isCurrentlyUploading ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin text-[#fe4a03]" />
                                      <span>Uploading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <UploadCloud size={14} className="text-[#fe4a03]" />
                                      <span>Choose Document</span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    className="hidden"
                                    disabled={isCurrentlyUploading}
                                    accept=".pdf,image/png,image/jpeg,image/webp"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        handleFileUpload(doc.key, doc.name, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Bottom Navigation Buttons */}
              <div className="mt-8 flex items-center justify-between">
                {currentStep === 1 ? (
                  <div className="text-xs sm:text-sm text-slate-600">
                    Already registered?{" "}
                    <Link
                      to="/vendor/login"
                      className="text-[#fe4a03] font-semibold hover:underline"
                    >
                      Sign in here
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="h-11 px-5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNextStep();
                    }}
                    className="h-11 px-7 rounded-xl bg-[#fe4a03] hover:bg-[#e04202] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ml-auto"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-7 rounded-xl bg-[#fe4a03] hover:bg-[#e04202] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs ml-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Registration & Verify Email
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Footer terms in Step 3 */}
              {currentStep === 3 && (
                <p className="text-center text-xs text-slate-500 mt-4">
                  By submitting your registration, you agree to SwagSync Marketplace Merchant Terms & Conditions.
                </p>
              )}
            </form>
          </main>
        </div>
      )}

      {/* POST-SUBMISSION: EMAIL VERIFICATION (OTP) */}
      {viewMode === "verify" && (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs"
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#fe4a03] flex items-center justify-center mx-auto mb-4">
              <Mail size={28} />
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Verify Your Email Address
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
              We have dispatched a 6-digit verification code to:
            </p>
            <div className="mt-2 inline-block font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-md text-sm font-mono">
              {formData.email}
            </div>

            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="------"
                  className="w-52 mx-auto text-center font-mono text-2xl font-bold tracking-widest px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[#fe4a03] focus:ring-2 focus:ring-orange-100 transition-all outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={verifyLoading || verificationCode.length < 6}
                className="w-full h-11 rounded-lg bg-[#fe4a03] hover:bg-[#e04202] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {verifyLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying Code...
                  </>
                ) : (
                  <>
                    Verify Email <CheckCircle2 size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setViewMode("form");
                  setCurrentStep(3);
                }}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ArrowLeft size={14} /> Edit Details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className={`font-semibold ${
                  resendCooldown > 0
                    ? "text-slate-400 cursor-not-allowed"
                    : "text-[#fe4a03] hover:underline cursor-pointer"
                }`}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* POST-VERIFICATION: AWAITING ADMIN APPROVAL SCREEN */}
      {viewMode === "success" && (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={36} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Clock size={14} /> Status: Pending Admin Approval
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Application Successfully Submitted!
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Your email address has been verified. Your vendor account for{" "}
              <strong className="text-slate-900">{formData.storeName}</strong> is now in the review queue.
            </p>

            <div className="my-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-left space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Email Ownership Verified (emailVerified = true)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-amber-600 shrink-0" />
                <span>Admin Document & Compliance Verification (PENDING)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-[#fe4a03] shrink-0" />
                <span>You will receive an official approval email once activated</span>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 text-left mb-6">
              <strong>Notice:</strong> As required by platform policy, vendor portal login is restricted until your store is officially approved by SwagSync administrators.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/vendor/login"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#fe4a03] text-white font-bold text-xs hover:bg-[#e04202] transition-colors shadow-xs"
              >
                Go to Vendor Login
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Return to Homepage
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VendorRegister;
