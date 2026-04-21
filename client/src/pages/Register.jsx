// ─────────────────────────────────────────────────────────
// Register.jsx — Student Self-Registration Page
// Allows new students to create an account.
//
// Two-step flow:
//   Step 1 — 'register': Fill in name, email, password, class & contact info
//   Step 2 — 'verify': Enter the 6-digit OTP sent to the email address
//
// After successful OTP verification, the student is redirected
// to the login page (with a 3-second delay so they see the success message).
// Note: Accounts start as Inactive — admin must approve before the student can log in.
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const Register = () => {
  // All registration form fields grouped into one state object
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contact_info: '',
    class_id: ''
  });
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [otp, setOtp] = useState('');                      // OTP entered in step 2
  const [step, setStep] = useState('register');            // Current step: 'register' or 'verify'
  const [classes, setClasses] = useState([]);              // Available class options from the server
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // ── Load Classes on Mount ────────────────────────────────
  // Fetch all available classes for the Grade & Section dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await api.get('/classes');
        setClasses(data);
        // Pre-select the first class to avoid an empty dropdown on load
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, class_id: data[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch classes', err);
      }
    };
    fetchClasses();
  }, []);

  // ── handleSubmit ─────────────────────────────────────────
  // Step 1: Sends registration data to the server.
  // On success, the server sends an OTP email and we advance to step 2.
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const { data } = await api.post('/auth/register', formData);
      setSuccess(data.message);
      setStep('verify'); // Move to OTP verification step
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  // ── handleVerifyOTP ──────────────────────────────────────
  // Step 2: Submits the OTP the user received in their email.
  // On success, waits 3 seconds then redirects to login.
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const { data } = await api.post('/auth/verify-email', { email: formData.email, otp });
      setSuccess(data.message);
      // Redirect after 3 seconds so the user can read the success message
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* ── Page Title ───────────────────────────────── */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 'register' ? 'Student Registration' : 'Verify Your Email'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'register' ? 'Join the school ecosystem' : `We've sent an OTP to ${formData.email}`}
        </p>
      </div>

      {/* ── Form Card ────────────────────────────────── */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Error and success alerts */}
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm font-medium border border-red-200">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm font-medium border border-green-200">{success}</div>}
          
          {step === 'register' ? (
            // ── Step 1: Registration Form ─────────────
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1">
                  <input required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input type="email" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>

              {/* Password with visibility toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    minLength="6" 
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                    value={formData.password} 
                    onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Grade & Section dropdown — fetched from the server */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Grade & Section</label>
                <div className="mt-1">
                  <select 
                    required 
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.class_id}
                    onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                  >
                    <option value="" disabled>Select your class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>Gr {c.grade} ({c.section})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact info (parent phone/address) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Information</label>
                <div className="mt-1">
                  <input required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Parent's phone number or address" value={formData.contact_info} onChange={e => setFormData({ ...formData, contact_info: e.target.value })} />
                </div>
              </div>

              <div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Register
                </button>
              </div>
            </form>
          ) : (
            // ── Step 2: OTP Verification Form ────────
            <form className="space-y-6" onSubmit={handleVerifyOTP}>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-center mb-2">Enter 6-digit OTP</label>
                <div className="mt-1">
                  {/* Large, centered OTP input for easy entry */}
                  <input 
                    required 
                    maxLength="6"
                    className="appearance-none block w-full px-3 py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-center text-3xl font-bold tracking-[1em] placeholder-gray-300" 
                    placeholder="000000"
                    value={otp} 
                    onChange={e => setOtp(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all font-mono uppercase tracking-widest">
                  Verify & Complete
                </button>
              </div>
            </form>
          )}

          {/* Link back to login for users who already have an account */}
          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
