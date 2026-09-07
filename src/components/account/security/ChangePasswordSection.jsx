import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ChangePasswordSection = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { changePassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const result = await changePassword(oldPassword, newPassword);

    if (result.success) {
      setSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-700 tracking-tight">Change Password</h2>
      </div>
      
      <div className="pt-2 max-w-xl">
        {error && (
          <div className="mb-6 p-4 border border-red-300 bg-red-50 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 border border-green-300 bg-green-50 text-green-700 text-sm font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-gray-100 pb-2">
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-500 mb-2">Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="w-full px-4 py-3 border border-gray-300 bg-white text-slate-700 font-medium focus:outline-none focus:border-[#FD7100] transition-all"
            />
          </div>

          <div className="border-b border-gray-100 pb-2">
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-500 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 bg-white text-slate-700 font-medium focus:outline-none focus:border-[#FD7100] transition-all"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-[#FD7100] text-white font-bold uppercase tracking-wider text-xs hover:bg-[#E06400] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordSection;
