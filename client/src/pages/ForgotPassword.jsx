// ─────────────────────────────────────────────────────────
// ForgotPassword.jsx — Step 1 of Password Reset Flow
// The user enters their registered email address.
// On success, a reset OTP is emailed to them and they are
// redirected to the ResetPassword page (with email in the URL).
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');      // Email the user types in
  const [error, setError] = useState('');      // Server error (e.g. email not found)
  const [success, setSuccess] = useState('');  // Confirmation message after OTP sent
  const [loading, setLoading] = useState(false); // Disables button while request is running
  const navigate = useNavigate();

  // ── handleSubmit ─────────────────────────────────────────
  // Calls the forgot-password API endpoint with the user's email.
  // On success: shows a confirmation message, then redirects to
  // the reset page after 2 seconds (passing email via URL query param).
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      setError('');
      setSuccess('');
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(data.message);
      // Redirect to reset page with email in URL so ResetPassword.jsx can pre-fill it
      setTimeout(() => navigate(`/reset-password?email=${email}`), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-inter">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Forgot Password?
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}
          {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100">{success}</div>}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Email Address</label>
              <div className="mt-1">
                <input 
                  type="email" 
                  required 
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all" 
                  placeholder="name@school.com"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Reset Password'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm">
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-2">
              <span className="text-xl">←</span> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
