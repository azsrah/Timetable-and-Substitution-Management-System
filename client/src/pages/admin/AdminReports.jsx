import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, BookOpen, 
  Calendar, Clock, Download,
  TrendingUp, AlertCircle, FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  const handleExport = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // 1. Page Border (colorful)
    doc.setDrawColor(77, 56, 255); // #4D38FF
    doc.setLineWidth(1.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
    
    // 2. School Logo support
    try {
      doc.addImage('/logo.png', 'PNG', 14, 12, 18, 18);
    } catch (e) {
      // Fallback if logo not found
    }

    // 3. Header
    doc.setFontSize(22);
    doc.setTextColor(77, 56, 255); // #4D38FF
    doc.text('KM/KM GOVT. MUSLIM MIXED SCHOOL', 35, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(180, 160, 0); // Gold/Yellow
    doc.text('System Summary Overview', 35, 30);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date} ${new Date().toLocaleTimeString()}`, 35, 36);
    
    // 4. Stats Table
    const tableData = [
      ['Total Users', stats.totalUsers],
      ['Active Classes', stats.totalClasses],
      ['Total Subjects', stats.totalSubjects],
      ['Pending Substitutions', stats.pendingSubstitutions]
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [77, 56, 255], // indigo
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11
      },
      styles: { 
        fontSize: 10,
        cellPadding: 5,
        lineColor: [230, 230, 230],
        lineWidth: 0.1
      },
      alternateRowStyles: { fillColor: [245, 247, 255] }
    });

    // 5. Quick Insights
    const finalY = (doc).lastAutoTable.finalY || 45;
    doc.setFontSize(14);
    doc.setTextColor(77, 56, 255);
    doc.text('Quick Insights', 14, finalY + 15);
    
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text('- Teacher Workload: 3 teachers exceeded weekly limits.', 14, finalY + 25);
    doc.text('- Substitution Accuracy: 98% accepted this week.', 14, finalY + 32);

    doc.save(`GMMS_Summarized_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 active:scale-95"
        >
          <Download size={18} />
          Export All Data
        </button>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Insights - Now more prominent */}
        <div className="lg:col-span-3 bg-indigo-950 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-6">Quick Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          </div>
          <button className="w-full md:w-auto px-8 bg-white text-indigo-950 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition shadow-lg">
            View Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
