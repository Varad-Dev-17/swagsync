import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Pencil, Trash2, Loader2, X, Check, User, Mail, Phone, Calendar, UserCheck, ShieldCheck, Lock, MapPin, UploadCloud } from 'lucide-react';
import SavedAddressSection from '../addresses/SavedAddressSection';

const ProfileSection = () => {
  const { user, updateProfilePhoto, removeProfilePhoto, updateProfileInfo, verifyEmailChange } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    mobileNo: user?.mobileNo || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    gender: user?.gender || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        mobileNo: user.mobileNo || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
      });
    }
  }, [user]);

  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    const result = await updateProfilePhoto(file);
    setIsUploading(false);
    
    if (!result.success) {
      alert(result.message || 'Failed to upload photo');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    
    setIsUploading(true);
    const result = await removeProfilePhoto();
    setIsUploading(false);

    if (!result.success) {
      alert(result.message || 'Failed to remove photo');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const result = await updateProfileInfo(formData);
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
      if (result.emailChanged) {
        setShowVerification(true);
      }
    } else {
      alert(result.message || 'Failed to update profile');
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode) return;
    setIsVerifying(true);
    const result = await verifyEmailChange(formData.email || user?.email, verificationCode);
    setIsVerifying(false);
    if (result.success) {
      setShowVerification(false);
      setVerificationCode('');
      alert('Email verified successfully!');
    } else {
      alert(result.message || 'Invalid verification code.');
    }
  };

  return (
    <div className="w-full max-w-[1200px] mr-auto space-y-6 pb-12">
      
      {/* 1. Top Banner (Identity) */}
      <div className="relative bg-gradient-to-r from-[#FFF5ED] to-[#FFFBF8] border border-orange-100 rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 overflow-hidden">
        {/* Profile Image Circle */}
        <div className="relative shrink-0">
          <div 
            className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-[#FFF5ED] border-[3px] sm:border-[4px] border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-[#FD7100] text-3xl sm:text-4xl cursor-pointer group"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#FD7100]" />
            ) : user?.profileImage?.url ? (
              <img src={user.profileImage.url} alt="Profile" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <>{user?.username?.charAt(0).toUpperCase() || 'U'}</>
            )}
          </div>
          {/* Camera Badge */}
          <button 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center text-[#FD7100] hover:bg-gray-50 transition-colors z-10"
          >
            <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/jpeg, image/png, image/webp, image/jpg" 
            className="hidden" 
          />
        </div>

        {/* User Info & Actions */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left z-10 relative w-full">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight mb-1">{user?.username || 'User'}</h2>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm text-gray-500 mb-2">
              <span className="break-all">{user?.email || '-'}</span>
              {user?.verified !== false && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] sm:text-xs font-bold">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-400">Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 sm:px-5 py-2 bg-[#FD7100] text-white hover:bg-[#E06400] text-xs sm:text-sm font-bold rounded-lg transition-colors disabled:opacity-70 shadow-sm flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>
            <button 
              onClick={handleRemovePhoto}
              disabled={isUploading || !user?.profileImage?.url}
              className="px-3 sm:px-5 py-2 bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 text-xs sm:text-sm font-bold rounded-lg transition-colors disabled:opacity-40 shadow-sm flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Remove</span>
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-2.5 sm:mt-3 font-medium">Recommended: Square PNG or JPG image under 5MB.</p>
        </div>
      </div>

    
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-extrabold text-slate-800">Verified</p>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium">Account Status</p>
          </div>
        </div>
        <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-[#FD7100]" />
          </div>
          <div>
            <p className="font-extrabold text-slate-800">Protected</p>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium">Security Level</p>
          </div>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-extrabold text-slate-800">Active</p>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium">Saved Addresses</p>
          </div>
        </div>
        <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="font-extrabold text-slate-800">2026</p>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium">Member Since</p>
          </div>
        </div>
      </div> */}

      {/* 3. Personal Information Card */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-[#FD7100]" />
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Personal Information</h3>
              <p className="text-sm text-gray-500 font-medium">Manage your personal details</p>
            </div>
          </div>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-bold transition-all"
            >
              <Pencil size={14} className="text-gray-500" />
              <span>Edit Details</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    username: user?.username || '',
                    email: user?.email || '',
                    mobileNo: user?.mobileNo || '',
                    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                    gender: user?.gender || '',
                  });
                }}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-bold transition-all"
              >
                <span>Cancel</span>
                <X size={14} />
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#FD7100] text-white rounded-lg hover:bg-[#E06400] text-sm font-bold transition-all disabled:opacity-70"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
            {/* Username Column */}
            <div className="flex flex-col space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#FD7100]" />
                Username
              </span>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-slate-700 font-bold focus:outline-none focus:border-[#FD7100]"
                />
              ) : (
                <span className="text-[15px] sm:text-[16px] font-bold text-slate-700">{user?.username || '-'}</span>
              )}
            </div>

            {/* Email Address Column */}
            <div className="flex flex-col space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#FD7100]" />
                Email Address
              </span>
              {isEditing ? (
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-slate-700 font-bold focus:outline-none focus:border-[#FD7100]"
                />
              ) : (
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-[15px] sm:text-[16px] font-bold text-slate-700">{user?.email || '-'}</span>
                  {user?.verified !== false ? (
                    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                      Verified
                    </span>
                  ) : (
                    <span 
                      className="text-red-600 text-[11px] font-bold cursor-pointer hover:underline uppercase tracking-wider px-1.5 py-0.5 bg-red-50 border border-red-200" 
                      onClick={() => {
                        setFormData({...formData, email: user?.email});
                        setShowVerification(true);
                      }}
                    >
                      Verify
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Number Column */}
            <div className="flex flex-col space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#FD7100]" />
                Mobile Number
              </span>
              {isEditing ? (
                <input 
                  type="tel" 
                  value={formData.mobileNo}
                  onChange={(e) => setFormData({...formData, mobileNo: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-slate-700 font-bold focus:outline-none focus:border-[#FD7100]"
                  placeholder="e.g. +91 9922055257"
                />
              ) : (
                <span className="text-[15px] sm:text-[16px] font-bold text-slate-700">{user?.mobileNo || '-'}</span>
              )}
            </div>

            {/* Date of Birth Column */}
            <div className="flex flex-col space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#FD7100]" />
                Date of Birth
              </span>
              {isEditing ? (
                <input 
                  type="date" 
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-slate-700 font-bold focus:outline-none focus:border-[#FD7100]"
                />
              ) : (
                <span className="text-[15px] sm:text-[16px] font-bold text-slate-700">
                  {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </span>
              )}
            </div>

            {/* Gender Column */}
            <div className="flex flex-col space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-[#FD7100]" />
                Gender
              </span>
              {isEditing ? (
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-slate-700 font-bold focus:outline-none focus:border-[#FD7100]"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <span className="text-[15px] sm:text-[16px] font-bold text-slate-700">{user?.gender || '-'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Saved Addresses Section */}
      <div className="mt-6">
        <SavedAddressSection />
      </div>
    
    
      
      {showVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-8 w-full max-w-md shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-extrabold text-slate-700 mb-2">Verify New Email</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              We sent a 6-digit verification code to <strong className="text-slate-700">{formData.email || user?.email}</strong>.
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Verification Code</label>
                <input 
                  type="text" 
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code" 
                  maxLength={6}
                  className="w-full border border-gray-300 px-4 py-3 text-lg font-bold tracking-widest text-center uppercase focus:outline-none focus:border-[#FD7100]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setShowVerification(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleVerifyEmail}
                  disabled={isVerifying || !verificationCode}
                  className="px-6 py-2.5 bg-[#FD7100] hover:bg-[#E06400] text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Verify Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
