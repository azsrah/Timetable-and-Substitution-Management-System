import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, LayoutDashboard, UserCheck, GraduationCap } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@school.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4 lg:p-8">
      {/* Background elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 bg-gradient-to-br from-[#4D38FF]/5 via-white to-indigo-50/30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4D38FF]/5 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[1100px] bg-white rounded-[40px] shadow-2xl shadow-[#4D38FF]/10 overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-white">
        {/* Left Side: Illustration / Info */}
        <div className="w-full md:w-1/2 relative overflow-hidden flex flex-col justify-between p-12 text-white">
          {/* Real School Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/school_real.jpg" 
              alt="School Building" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 mb-16 group">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
                <LayoutDashboard size={24} className="text-white" />
              </div>
              <span className="font-black text-2xl tracking-tight">GMMS</span>
            </Link>

            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-black leading-tight">
                Welcome <br /> Back to <span className="text-yellow-400">School</span>
              </h2>
              <p className="text-white/80 text-lg font-medium leading-relaxed max-w-sm">
                Access your personalized dashboard to manage classes, view timetables, and stay updated.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-12 relative z-10">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <UserCheck className="text-yellow-400 mb-2" size={20} />
              <div className="text-xs font-black uppercase tracking-widest text-white/60">Verified</div>
              <div className="font-bold">Secure Login</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <GraduationCap className="text-yellow-400 mb-2" size={20} />
              <div className="text-xs font-black uppercase tracking-widest text-white/60">Education</div>
              <div className="font-bold">Smart SMS</div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-black text-slate-900 mb-2">Sign In</h1>
              
            </div>
            
            {error && (
              <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[2px] ml-1">Email Address</label>
                <input 
                  className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:bg-white focus:border-[#4D38FF] outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                  placeholder="name@school.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[2px] ml-1 flex justify-between">
                  <span>Password</span>
                  <Link to="/forgot-password" size="sm" className="text-[#4D38FF] hover:text-[#4D38FF]/80 lowercase normal-case tracking-normal">Forgot?</Link>
                </label>
                <div className="relative">
                  <input 
                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:bg-white focus:border-[#4D38FF] outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#4D38FF] transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-[#4D38FF] transition-all shadow-xl shadow-slate-200 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:transform-none"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-10 pt-10 border-t border-slate-100 text-center">
              <span className="text-slate-400 font-bold">Don't have an account? </span>
              <Link to="/register" className="text-[#4D38FF] font-black hover:underline underline-offset-4">Register as Student</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
