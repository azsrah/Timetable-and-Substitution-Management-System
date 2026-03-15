import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Users, Shield, Book,
  ArrowRight, Menu, X, LayoutDashboard
} from 'lucide-react';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const coreFeatures = [
    {
      icon: <Calendar className="text-blue-600" size={24} />,
      iconBg: "bg-blue-50",
      title: "Smart Timetable",
      description: "Automated scheduling with drag-and-drop interface and conflict detection."
    },
    {
      icon: <Users className="text-purple-600" size={24} />,
      iconBg: "bg-purple-50",
      title: "Role-Based Access",
      description: "Dedicated dashboards for Principals, Teachers, Students, and Administrators."
    },
    {
      icon: <Shield className="text-emerald-600" size={24} />,
      iconBg: "bg-emerald-50",
      title: "Smart Substitution",
      description: "Automatic teacher assignment when regular staff are on leave."
    },
    {
      icon: <Book className="text-orange-600" size={24} />,
      iconBg: "bg-orange-50",
      title: "Performance Tracking",
      description: "Monitor student grades and attendance with real-time analytics."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-[#4D38FF] px-4 py-1.5 rounded-lg text-white font-black text-sm tracking-wide">
              GMMS
            </div>
            <span className="text-xl font-black text-slate-900">Smart School</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/login" className="text-sm font-black text-slate-600 hover:text-slate-900 transition-colors">Login</Link>
            <Link 
              to="/register" 
              className="bg-[#0F172A] text-white px-6 py-2.5 rounded-lg font-black text-sm hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              Register
            </Link>
          </div>

          <button className="md:hidden text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white p-8 pt-24 md:hidden">
          <div className="flex flex-col gap-6 text-center">
            <Link to="/login" className="text-xl font-black text-slate-900" onClick={() => setMobileMenuOpen(false)}>Login</Link>
            <Link to="/register" className="text-xl font-black text-[#4D38FF]" onClick={() => setMobileMenuOpen(false)}>Register</Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h1 className="text-6xl md:text-[80px] font-black leading-[1.05] tracking-tight text-[#1E293B]">
                School <br />
                Timetable <br />
                <span className="text-[#6366F1]">Management <br /> System</span>
              </h1>
              <p className="text-slate-500 text-lg md:text-xl font-medium max-w-lg leading-relaxed">
                A comprehensive digital platform for government schools. Automate timetables, manage substitutions, and track student progress with ease.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link 
                  to="/login" 
                  className="bg-[#0F172A] text-white px-10 py-4 rounded-xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3 group"
                >
                  Get Started
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/about" 
                  className="bg-white text-slate-900 border-2 border-slate-100 px-10 py-4 rounded-xl font-black text-lg hover:bg-slate-50 transition-all shadow-sm"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="relative group">
              <div className="relative rounded-[48px] overflow-hidden shadow-2xl border-8 border-white/50">
                <img 
                  src="/images/school_real.jpg" 
                  alt="KM/KM Govt. Muslim Mixed School" 
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Attendance Card Overlay */}
              <div className="absolute -bottom-10 -right-6 md:right-0 bg-white p-6 rounded-[32px] shadow-2xl border border-slate-100 max-w-[240px] animate-bounce-slow">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Live Updates</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-slate-900">98% Attendance</div>
                  <div className="text-xs text-slate-400 font-bold leading-tight">Across all grades today</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Core Features</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreFeatures.map((feature, idx) => (
              <div 
                key={idx} 
                className="bg-white p-10 rounded-[40px] border border-slate-50 shadow-lg shadow-slate-100/50 hover:shadow-2xl hover:shadow-slate-200 transition-all hover:-translate-y-2 text-center group"
              >
                <div className={`w-16 h-16 ${feature.iconBg} rounded-[24px] flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h4 className="text-2xl font-black mb-4 text-slate-900">{feature.title}</h4>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar (Dark) */}
      <section className="bg-[#0F172A] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 items-center text-center">
            <div className="space-y-2">
              <div className="text-6xl md:text-7xl font-black text-white">100%</div>
              <div className="text-slate-400 font-bold tracking-widest uppercase text-xs">Digital Transition</div>
            </div>
            <div className="space-y-2 border-y md:border-y-0 md:border-x border-slate-800 py-12 md:py-0">
              <div className="text-6xl md:text-7xl font-black text-white">Fast</div>
              <div className="text-slate-400 font-bold tracking-widest uppercase text-xs">Auto Substitution</div>
            </div>
            <div className="space-y-2">
              <div className="text-6xl md:text-7xl font-black text-white">Secure</div>
              <div className="text-slate-400 font-bold tracking-widest uppercase text-xs">Data Protection</div>
            </div>
          </div>
        </div>
      </section>

      {/* School Showcase Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">School Showcase</h2>
            <p className="text-slate-400 font-bold mt-4">Glimpses of our vibrant learning environment</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 relative group overflow-hidden rounded-[40px]">
              <img 
                src="/images/school_classroom.png" 
                alt="Modern Infrastructure" 
                className="w-full aspect-video md:aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10">
                <h4 className="text-2xl font-black text-white">Modern Infrastructure</h4>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="relative group overflow-hidden rounded-[40px] flex-1">
                <img 
                  src="/images/school_students.png" 
                  alt="Collaborative Learning" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-10 left-10">
                  <h4 className="text-2xl font-black text-white">Collaborative Learning</h4>
                </div>
              </div>
              
              <div className="bg-[#0F172A] p-12 rounded-[40px] text-white space-y-8 flex flex-col justify-center">
                <h4 className="text-3xl font-black leading-tight">Inspiring Future <br /> Generations</h4>
                <p className="text-slate-400 font-medium">Our digital platform empowers teachers to focus on what matters most: the students.</p>
                <Link to="/register" className="flex items-center gap-3 text-blue-400 font-black hover:gap-5 transition-all">
                  Join our community
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-slate-50 text-center">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          <div className="text-3xl font-black text-[#1E293B] tracking-tight">GMMS</div>
          <div className="text-slate-400 font-bold text-sm">
            © 2026 Government School Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
