import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Lock, AlertCircle, Save, User, Mail, GraduationCap, Phone } from 'lucide-react';

const StudentSettings = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    contact_info: user?.contact_info || '',
  });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const handlePasswordChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      addNotification({ message: 'Passwords do not match', type: 'error' });
      return;
    }
    if (formData.newPassword.length < 6) {
      addNotification({ message: 'Password must be at least 6 characters long', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      addNotification({ message: 'Password updated successfully!', type: 'success' });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addNotification({ message: err.response?.data?.message || 'Failed to update password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await api.put('/users/profile', { contact_info: profileData.contact_info });
      addNotification({ message: 'Profile information updated!', type: 'success' });
    } catch (err) {
      addNotification({ message: 'Failed to update profile information', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Profile Information Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Profile Information</h1>
              <p className="text-sm text-slate-500">Your account details and contact information</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2">
                <User size={14} /> Full Name
              </label>
              <p className="text-lg font-medium text-slate-800">{user?.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2">
                <Mail size={14} /> Email Address
              </label>
              <p className="text-lg font-medium text-slate-800">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2">
                <GraduationCap size={14} /> Class / Grade
              </label>
              <p className="text-lg font-medium text-slate-800">
                {user?.grade ? `Grade ${user.grade}${user.section}` : 'N/A'}
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 pt-6 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Phone size={18} className="text-slate-400" /> Contact Information
              </label>
              <input
                type="text"
                name="contact_info"
                value={profileData.contact_info}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="Phone number or address..."
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className={`px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center gap-2 ${profileLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {profileLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
              {profileLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Lock size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Security</h1>
              <p className="text-sm text-slate-500">Manage your password</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
              {loading ? 'Updating...' : 'Save Password'}
            </button>
          </form>
          <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
              <AlertCircle size={16} /> Password Requirements
            </h3>
            <ul className="text-xs text-amber-700 space-y-1 ml-6 list-disc">
              <li>Must be at least 6 characters long</li>
              <li>Strong passwords combine letters, numbers, and symbols</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSettings;
