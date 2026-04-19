import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/Card';
import { FileText, Download, Calendar, Filter, CheckCircle, Clock, Search } from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AttendanceReports = () => {
  const { addNotification } = useNotifications();
  const [attendance, setAttendance] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    search: ''
  });

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance?startDate=${filters.startDate}&endDate=${filters.endDate}`);
      setAttendance(data);
      setFilteredData(data);
    } catch (err) {
      addNotification({ message: 'Failed to fetch attendance records', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    let result = [...attendance];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(a => 
        a.teacher_name.toLowerCase().includes(searchLower) ||
        a.teacher_email.toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(result);
  }, [filters.search, attendance]);

  const setQuickFilter = (type) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (type === 'week') {
      const day = today.getDay();
      start.setDate(today.getDate() - day);
      start.setHours(0,0,0,0);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
    } else if (type === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23,59,59,999);
    }

    setFilters({
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  const generatePDF = (outputType = 'save') => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setDrawColor(0, 128, 0); 
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      doc.setFontSize(22);
      doc.setTextColor(0, 100, 0);
      doc.text('KM/KM GOVT. MUSLIM MIXED SCHOOL', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(180, 160, 0);
      doc.text('Teacher Attendance Report', pageWidth / 2, 33, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 42, { align: 'center' });
      doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, pageWidth / 2, 47, { align: 'center' });

      const tableColumn = ["Date", "Teacher", "Check-In", "Check-Out", "Status", "Duration"];
      const tableRows = filteredData.map(a => {
        let duration = '-';
        if (a.check_in_time && a.check_out_time) {
          const start = new Date(`1970-01-01T${a.check_in_time}`);
          const end = new Date(`1970-01-01T${a.check_out_time}`);
          const diff = (end - start) / 1000 / 60;
          duration = `${Math.floor(diff / 60)}h ${Math.floor(diff % 60)}m`;
        }
        return [
          new Date(a.date).toLocaleDateString(),
          a.teacher_name,
          a.check_in_time ? a.check_in_time.substring(0, 5) : '-',
          a.check_out_time ? a.check_out_time.substring(0, 5) : '-',
          a.status,
          duration
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        theme: 'striped',
        headStyles: { fillColor: [0, 128, 0], halign: 'center' },
        styles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [240, 255, 240] }
      });

      if (outputType === 'preview') {
        const blob = doc.output('bloburl');
        window.open(blob, '_blank');
      } else {
        doc.save(`Attendance_Report_${filters.startDate}_to_${filters.endDate}.pdf`);
        addNotification({ message: 'Report downloaded successfully', type: 'success' });
      }
    } catch (error) {
      console.error(error);
      addNotification({ message: 'Failed to generate report', type: 'error' });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileText className="text-indigo-600" size={36} />
            Attendance Reports
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Analyze teacher attendance trends and export details.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <button 
            onClick={() => generatePDF('preview')}
            disabled={filteredData.length === 0}
            className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl border border-slate-200 hover:bg-slate-200 transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Search size={18} />
            Preview
          </button>
          <button 
            onClick={() => generatePDF('save')}
            disabled={filteredData.length === 0}
            className="flex-1 md:flex-none bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 font-black disabled:opacity-50"
          >
            <Download size={20} />
            Download PDF
          </button>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white/50 backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={14} /> Start Date
              </label>
              <input 
                type="date" 
                className="w-full border-slate-200 bg-white rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-bold text-slate-700 shadow-sm border" 
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={14} /> End Date
              </label>
              <input 
                type="date" 
                className="w-full border-slate-200 bg-white rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-bold text-slate-700 shadow-sm border" 
                value={filters.endDate}
                onChange={e => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Search size={14} /> Search Teacher
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Name or email..."
                  className="w-full border-slate-200 bg-white rounded-2xl p-4 pl-12 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-bold text-slate-700 shadow-sm border" 
                  value={filters.search}
                  onChange={e => setFilters({...filters, search: e.target.value})}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <button onClick={() => setQuickFilter('today')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase hover:bg-slate-200 transition">Today</button>
            <button onClick={() => setQuickFilter('week')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase hover:bg-slate-200 transition">This Week</button>
            <button onClick={() => setQuickFilter('month')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase hover:bg-slate-200 transition">This Month</button>
            <button onClick={() => { setFilters({...filters, search: ''}); }} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-black uppercase hover:bg-rose-100 transition ml-auto">Clear Search</button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30 font-black text-slate-900 flex justify-between">
          Preview
          <span className="text-xs text-slate-400">{filteredData.length} records</span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
             <div className="p-20 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b">
                  <th className="p-6">Date</th>
                  <th className="p-6">Teacher</th>
                  <th className="p-6 text-center">Check-In</th>
                  <th className="p-6 text-center">Check-Out</th>
                  <th className="p-6 text-center">Duration</th>
                  <th className="p-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 italic">
                {filteredData.map(a => {
                   let duration = '-';
                   if (a.check_in_time && a.check_out_time) {
                     const start = new Date(`1970-01-01T${a.check_in_time}`);
                     const end = new Date(`1970-01-01T${a.check_out_time}`);
                     const diff = (end - start) / 1000 / 60;
                     duration = `${Math.floor(diff / 60)}h ${Math.floor(diff % 60)}m`;
                   }
                   return (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 font-bold text-slate-900">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="p-6">
                        <div className="font-bold text-slate-700">{a.teacher_name}</div>
                        <div className="text-xs text-slate-400">{a.teacher_email}</div>
                      </td>
                      <td className="p-6 text-center font-mono text-xs">{a.check_in_time?.substring(0,5) || '-'}</td>
                      <td className="p-6 text-center font-mono text-xs">{a.check_out_time?.substring(0,5) || '-'}</td>
                      <td className="p-6 text-center text-sm font-bold text-slate-500">{duration}</td>
                      <td className="p-6 text-right">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{a.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceReports;
