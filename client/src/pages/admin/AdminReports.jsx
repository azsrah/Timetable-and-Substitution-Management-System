import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, BookOpen, 
  Calendar, Clock, Download,
  TrendingUp, AlertCircle
} from 'lucide-react';
import api from '../../services/api';

const AdminReports = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    pendingSubstitutions: 0,
    resourceUtilization: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch these from a dedicated analytics endpoint
    // For now, we'll simulate or fetch basic counts
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Placeholder for real data fetching
        // const response = await api.get('/admin/stats');
        // setStats(response.data);
        
        // Mock data for initial preview
        setStats({
          totalUsers: 45,
          totalClasses: 12,
          totalSubjects: 18,
          pendingSubstitutions: 3,
          resourceUtilization: 72
        });
      } catch (error) {
        console.error('Error fetching reports data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const ReportCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp size={12} className="mr-1" />
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Reports</h1>
          <p className="text-slate-500 mt-1">Overview of school operations and resource analytics.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
          <Download size={18} />
          Export All Data
        </button>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          color="bg-blue-500" 
          trend="+4%"
        />
        <ReportCard 
          title="Active Classes" 
          value={stats.totalClasses} 
          icon={BookOpen} 
          color="bg-indigo-500" 
        />
        <ReportCard 
          title="Pending Subs" 
          value={stats.pendingSubstitutions} 
          icon={Clock} 
          color="bg-amber-500" 
        />
        <ReportCard 
          title="Resource Utilization" 
          value={`${stats.resourceUtilization}%`} 
          icon={Calendar} 
          color="bg-emerald-500" 
          trend="+12%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resource Usage Chart Placeholder */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-slate-800">Resource Usage Analytics</h2>
            <select className="bg-slate-50 border-none rounded-lg text-sm font-semibold text-slate-600 p-2 outline-none cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[45, 60, 35, 80, 55, 90, 70].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <div 
                  className="w-full bg-indigo-100 rounded-lg group-hover:bg-indigo-500 transition-all duration-300 relative"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {height}%
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Day {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-indigo-950 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
          <h2 className="text-lg font-bold mb-6">Quick Insights</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-white bg-opacity-10 p-2 rounded-lg h-fit">
                <AlertCircle size={20} className="text-indigo-300" />
              </div>
              <div>
                <p className="font-bold text-indigo-100">Teacher Workload</p>
                <p className="text-sm text-indigo-300 mt-1">3 teachers have exceeded the 35-period weekly limit.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-white bg-opacity-10 p-2 rounded-lg h-fit">
                <Calendar size={20} className="text-indigo-300" />
              </div>
              <div>
                <p className="font-bold text-indigo-100">Substitution Accuracy</p>
                <p className="text-sm text-indigo-300 mt-1">98% of substitutions were accepted by teachers this week.</p>
              </div>
            </div>
          </div>
          <button className="w-full bg-white text-indigo-950 py-3 rounded-2xl font-bold mt-12 hover:bg-indigo-50 transition">
            View Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
