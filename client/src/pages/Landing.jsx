import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Users, Shield, Book,
  ArrowRight, Menu, X, LayoutDashboard,
  Star, Zap, CheckCircle,
  Twitter, Linkedin, Github, Mail, Phone, MapPin
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
      icon: <Calendar className="text-white" size={24} />,
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      title: "Smart Timetable",
      description: "Automated scheduling with drag-and-drop interface and conflict detection."
    },
    {
      icon: <Users className="text-white" size={24} />,
      iconBg: "bg-gradient-to-br from-purple-500 to-pink-600",
      title: "Role-Based Access",
      description: "Dedicated dashboards for Principals, Teachers, Students, and Administrators."
    },
    {
      icon: <Shield className="text-white" size={24} />,
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      title: "Smart Substitution",
      description: "Automatic teacher assignment when regular staff are on leave."
    },
    {
      icon: <Book className="text-white" size={24} />,
      iconBg: "bg-gradient-to-br from-orange-500 to-red-600",
      title: "Performance Tracking",
      description: "Monitor student grades and attendance with real-time analytics."
    }
  ];

  return (
    <div className="min-h-screen bg-mesh font-sans text-slate-900 selection:bg-indigo-100">
      
      {/* Dynamic Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] bg-blue-200/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] bg-indigo-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'glass-card py-3 mt-4 mx-auto max-w-[95%] rounded-2xl shadow-xl' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2.5 rounded-xl text-white shadow-lg group-hover:rotate-12 transition-transform">
              <Star size={20} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight leading-none text-slate-900">GMMS</span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Smart School</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Sign In</Link>
            <Link 
              to="/register" 
              className="btn-primary-vibrant px-8 py-3 rounded-xl font-bold text-sm tracking-wide shadow-indigo-200/50"
            >
              Get Started
            </Link>
          </div>

          <button className="md:hidden glass-card p-2 rounded-lg text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 glass-card p-10 pt-32 md:hidden animate-fade-in">
          <div className="flex flex-col gap-8 text-center">
            <Link to="/login" className="text-2xl font-black text-slate-900" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link to="/register" className="text-2xl font-black text-indigo-600" onClick={() => setMobileMenuOpen(false)}>Join Now</Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-56 md:pb-40 z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-7 space-y-10 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100/50">
                <Zap size={14} className="fill-current" />
                Modern Education Platform
              </div>
              <h1 className="text-6xl md:text-[92px] font-black leading-[0.95] tracking-tight text-slate-900">
                Shape the <br />
                <span className="text-gradient">Future of</span> <br />
                Learning
              </h1>
              <p className="text-slate-500 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
                Empower your school with scheduling, seamless teacher substitutions, and comprehensive student tracking—all in one vibrant platform.
              </p>
              <div className="flex flex-wrap gap-6 pt-4">
                <Link 
                  to="/login" 
                  className="btn-primary-vibrant px-12 py-5 rounded-2xl font-black text-lg flex items-center gap-3 group"
                >
                  Get Started Free
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/about" 
                  className="glass-card px-12 py-5 rounded-2xl font-black text-lg text-slate-900 hover:bg-white/80 transition-all flex items-center gap-2"
                >
                  See Demo
                </Link>
              </div>
              
              <div className="flex items-center gap-6 pt-8">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-bold text-slate-400">
                   <span className="text-slate-900">500+ Schools</span> joined this month
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative z-10 animate-float">
                <div className="relative rounded-[56px] overflow-hidden shadow-[0_20px_80px_rgba(99,102,241,0.25)] border-8 border-white">
                  <img 
                    src="/images/school_hero_vibrant.png" 
                    alt="Smart School Concept" 
                    className="w-full aspect-[4/5] object-cover scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent"></div>
                </div>

                {/* Live Card Overlay */}
                <div className="absolute -bottom-10 -left-10 glass-card p-6 rounded-[32px] max-w-[200px] animate-bounce-slow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                      <CheckCircle size={20} />
                    </div>
                    <span className="text-xs font-black text-slate-900">Success</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">98% Faster</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Substitution logic</div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-1/2 -right-10 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-32 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-24 max-w-3xl mx-auto space-y-4">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Powerful tools, built <br /> for <span className="text-gradient">modern teams</span>
            </h2>
            <p className="text-slate-400 font-bold text-lg">Everything you need to manage your institution efficiently</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreFeatures.map((feature, idx) => (
              <div 
                key={idx} 
                className="glass-card p-10 rounded-[48px] hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-3 transition-all duration-500 group"
              >
                <div className={`w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:rotate-12 transition-transform`}>
                  {feature.icon}
                </div>
                <h4 className="text-2xl font-black mb-4 text-slate-900 tracking-tight">{feature.title}</h4>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hero-style Secondary Section */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        {/* Dark Grid Background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#6366f1 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-center text-center">
            <div className="space-y-4 group">
              <div className="text-7xl md:text-8xl font-black text-white group-hover:scale-110 transition-transform duration-500">100%</div>
              <div className="text-indigo-400 font-black tracking-widest uppercase text-xs">Digital Transition</div>
            </div>
            <div className="space-y-4 group border-y md:border-y-0 md:border-x border-slate-800 py-16 md:py-0">
              <div className="text-7xl md:text-8xl font-black text-white group-hover:scale-110 transition-transform duration-500 text-gradient">Fast</div>
              <div className="text-indigo-400 font-black tracking-widest uppercase text-xs">Auto Substitution</div>
            </div>
            <div className="space-y-4 group">
              <div className="text-7xl md:text-8xl font-black text-white group-hover:scale-110 transition-transform duration-500">Secure</div>
              <div className="text-indigo-400 font-black tracking-widest uppercase text-xs">Data Protection</div>
            </div>
          </div>
        </div>
      </section>

      {/* School Showcase Section */}
      <section className="py-40 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl space-y-4">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">Our School <span className="text-gradient">Gallery</span></h2>
              <p className="text-slate-400 font-bold text-lg">Glimpses of our vibrant learning environment and modern digital workflow.</p>
            </div>
            <Link to="/gallery" className="btn-primary-vibrant px-10 py-4 rounded-2xl font-black text-lg shadow-indigo-200/50">
              View All Photos
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 relative group overflow-hidden rounded-[56px] shadow-2xl">
              <img 
                src="/images/school_classroom.png" 
                alt="Modern Infrastructure" 
                className="w-full aspect-[16/10] object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-12 left-12 space-y-2">
                <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">Campus</span>
                <h4 className="text-4xl font-black text-white tracking-tight">Interactive Classroom Systems</h4>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="relative group overflow-hidden rounded-[48px] shadow-xl flex-1">
                <img 
                  src="/images/school_students.png" 
                  alt="Collaborative Learning" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-10 left-10">
                  <h4 className="text-2xl font-black text-white tracking-tight">Active Learning</h4>
                </div>
              </div>
              
              <div className="glass-card p-12 rounded-[48px] space-y-8 flex flex-col justify-center border-indigo-100/50">
                <h4 className="text-3xl font-black leading-tight text-slate-900">Inspiring Future <br /> Generations</h4>
                <p className="text-slate-400 font-medium">Empowering teachers with digital precision to focus on student growth.</p>
                <Link to="/register" className="flex items-center gap-3 text-indigo-600 font-black hover:gap-6 transition-all group">
                  Join our community
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 pt-24 pb-12 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-[80px]"></div>

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-20">
            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-8">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2.5 rounded-xl text-white shadow-lg">
                  <Star size={20} fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tight leading-none text-white">GMMS</span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Smart School</span>
                </div>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
                Revolutionizing school management with AI-powered tools for timetabling, attendance, and resource allocation. Empowering the next generation of educators.
              </p>
              <div className="flex gap-4">
                {[Twitter, Linkedin, Github].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-y-1">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div className="lg:col-span-2 space-y-8">
              <h4 className="text-white font-black uppercase tracking-widest text-xs">Product</h4>
              <ul className="space-y-4">
                {['Features', 'Timetables', 'Substitutions', 'Attendance', 'Security'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 font-bold text-sm hover:text-indigo-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <h4 className="text-white font-black uppercase tracking-widest text-xs">Support</h4>
              <ul className="space-y-4">
                {['Help Center', 'Privacy Policy', 'Terms of Use', 'Documentation', 'Contact'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 font-bold text-sm hover:text-indigo-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter/Contact Column */}
            <div className="lg:col-span-4 space-y-8">
              <h4 className="text-white font-black uppercase tracking-widest text-xs">Stay Updated</h4>
              <p className="text-slate-400 font-medium text-sm">Join our newsletter to get the latest updates and educational resources.</p>
              <div className="relative group">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-slate-800 border border-slate-700/50 p-4 rounded-2xl text-white font-bold text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button className="absolute right-2 top-2 bg-indigo-600 hover:bg-indigo-500 text-white p-2 px-4 rounded-xl text-xs font-black transition-all active:scale-95">
                  Join
                </button>
              </div>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-slate-400">
                  <Mail size={16} className="text-indigo-500" />
                  <span className="text-sm font-bold">hello@smartschool.edu</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Phone size={16} className="text-indigo-500" />
                  <span className="text-sm font-bold">+1 (555) 000-1111</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <MapPin size={16} className="text-indigo-500" />
                  <span className="text-sm font-bold">KM Govt. Muslim Mixed School</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
            <div className="text-slate-500 font-bold">
              © 2026 GMMS Smart School. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-bold">
              
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
