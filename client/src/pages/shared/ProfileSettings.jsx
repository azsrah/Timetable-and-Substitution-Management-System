import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  Lock, AlertCircle, Save, User, Mail, 
  GraduationCap, Phone, Eye, EyeOff, Shield,
  BookOpen
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/Card';

const ProfileSettings = () => {
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
  
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        contact_info: user.contact_info || '',
      }));
    }
  }, [user]);
  
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
      addNotification({ message: 'New passwords do not match', type: 'error' });
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
      addNotification({ 
        message: err.response?.data?.message || 'Failed to update password', 
        type: 'error' 
      });
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500">Manage your profile information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Identity & Contact */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex items-center gap-3 border-b border-slate-50 bg-slate-50/30 p-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Profile Information</h3>
                <p className="text-xs text-slate-500">Public and internal identification</p>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <p className="text-lg font-semibold text-slate-800">{user?.name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <p className="text-lg font-semibold text-slate-800">{user?.email}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Role</label>
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-indigo-500" />
                    <span className="text-lg font-semibold text-slate-800">{user?.role}</span>
                  </div>
                </div>
                {user?.role === 'Student' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grade & Section</label>
                    <div className="flex items-center gap-2">
                      <GraduationCap size={16} className="text-indigo-500" />
                      <span className="text-lg font-semibold text-slate-800">Grade {user.grade}{user.section}</span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleProfileSubmit} className="pt-6 border-t border-slate-100 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" /> Contact Information
                  </label>
                  <input
                    type="text"
                    name="contact_info"
                    value={profileData.contact_info}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    placeholder="Enter phone number or address..."
                  />
                  <p className="text-[11px] text-slate-400 italic">This information will be visible to administrators for reachability.</p>
                </div>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className={`mt-4 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 ${profileLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {profileLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                  <span>{profileLoading ? 'Updating...' : 'Update Profile'}</span>
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security */}
        <div className="space-y-8">
          <Card className="h-full">
            <CardHeader className="flex items-center gap-3 border-b border-slate-50 bg-slate-50/30 p-6">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Security</h3>
                <p className="text-xs text-slate-500">Update your account password</p>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                      placeholder="••••••••"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                      className="w-full px-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full mt-4 px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                  <span>{loading ? 'Saving...' : 'Save Password'}</span>
                </button>
              </form>

              <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                <AlertCircle size={18} className="text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-tight mb-1">Password Requirements</h4>
                  <ul className="text-[11px] text-amber-700 space-y-1 list-disc pl-3">
                    <li>Must be at least 6 characters</li>
                    <li>Not the same as current password</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
