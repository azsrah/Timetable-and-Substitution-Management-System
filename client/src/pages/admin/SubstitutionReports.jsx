// ─────────────────────────────────────────────────────────
// SubstitutionReports.jsx — Analytics for Substitutions
// Allows the admin to view a history of all substitutions,
// apply date and status filters, and generate a branded PDF
// using 'jspdf' and 'jspdf-autotable'.
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/Card';
import { FileText, Download, Calendar, Filter, CheckCircle, Clock, Search } from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SubstitutionReports = () => {
  const { addNotification } = useNotifications();
  const [substitutions, setSubstitutions] = useState([]);      // Unfiltered data from API
  const [filteredData, setFilteredData] = useState([]);        // Data to display/print after filters applied
  const [loading, setLoading] = useState(false);
  
  // ── Filters state ───────────────────────────────────────
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Default to start of month
    endDate: new Date().toISOString().split('T')[0], // Default to today
    status: 'All', // 'Pending', 'Accepted'
    search: ''     // Name or Subject Search
  });

  const [errors, setErrors] = useState({
    startDate: '',
    endDate: ''
  });

  // ── validateDates ───────────────────────────────────────
  const validateDates = (start, end) => {
    const newErrors = { startDate: '', endDate: '' };
    const today = new Date().toISOString().split('T')[0];

    if (!start || !end) {
      if (!start) newErrors.startDate = 'Please select a start date.';
      if (!end) newErrors.endDate = 'Please select an end date.';
    } else {
      if (start > today) {
        newErrors.startDate = 'Start date cannot be in the future.';
      }
      if (end < start) {
        newErrors.endDate = 'End date cannot be before start date.';
      }
    }

    setErrors(newErrors);
    return !newErrors.startDate && !newErrors.endDate;
  };

  const fetchSubstitutions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/substitutions/all');
      setSubstitutions(data);
      setFilteredData(data);
    } catch (err) {
      addNotification({ message: 'Failed to fetch substitution records', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubstitutions();
  }, []);

  // ── Apply Filters Client-Side ───────────────────────────
  // Re-runs whenever filters or raw data change
  useEffect(() => {
    let result = [...substitutions];

    // Helper to extract the local YYYY-MM-DD from an ISO string
    const getLocalDate = (dateObj) => {
      const d = new Date(dateObj);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    };

    if (!validateDates(filters.startDate, filters.endDate)) {
      setFilteredData([]);
      return;
    }

    if (filters.startDate) {
      result = result.filter(s => getLocalDate(s.date) >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter(s => getLocalDate(s.date) <= filters.endDate);
    }
    if (filters.status !== 'All') {
      result = result.filter(s => s.status === filters.status);
    }
    // Deep search across multiple text fields
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(s => 
        s.absent_teacher_name.toLowerCase().includes(searchLower) ||
        s.substitute_teacher_name.toLowerCase().includes(searchLower) ||
        s.subject_name.toLowerCase().includes(searchLower) ||
        `grade ${s.grade}-${s.section}`.toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(result);
  }, [filters, substitutions]);

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
      
      // End of this week (Saturday)
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
    } else if (type === 'month') {
      // From 1st of month to end of month
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

  // ── generatePDF ─────────────────────────────────────────
  // Creates a styled PDF report using the currently filtered data.
  // 'outputType' determines if it opens in a new tab ('preview') or downloads directly ('save')
  const generatePDF = (outputType = 'save') => {
    console.log('Generating PDF...', { outputType, records: filteredData.length });
    try {
      // 1. Initialize empty jsPDF document
      const doc = new jsPDF();
      console.log('jsPDF initialized');

      // 2. Add Branding & Letterhead
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Draw outer border (Green)
      doc.setDrawColor(0, 128, 0); 
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      try {
        doc.addImage('/logo.png', 'PNG', 14, 12, 25, 25);
      } catch (e) {
        console.warn('Logo not found at /logo.png, skipping logo addition.');
      }

      // Title lines
      doc.setFontSize(24);
      doc.setTextColor(0, 100, 0);
      doc.text('KM/KM GOVT. MUSLIM MIXED SCHOOL', pageWidth / 2, 22, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(180, 160, 0);
      doc.text('Substitution Management Report', pageWidth / 2, 31, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 38, { align: 'center' });
      doc.text(`Period: ${filters.startDate || 'All Time'} to ${filters.endDate || 'Now'}`, pageWidth / 2, 43, { align: 'center' });

      doc.setTextColor(0, 0, 0); // Reset

      // 3. Prepare Data for AutoTable
      console.log('Mapping table rows...');
      const tableColumn = ["Date", "Absent Teacher", "Substitute", "Class", "Subject", "Period", "Status"];
      const tableRows = filteredData.map(s => {
        try {
          const dateStr = s.date ? new Date(s.date).toLocaleDateString() : 'N/A';
          const startTime = s.start_time ? String(s.start_time).substring(0, 5) : '00:00';
          return [
            dateStr,
            s.absent_teacher_name || 'N/A',
            s.substitute_teacher_name || 'N/A',
            `${s.grade || ''}${s.section || ''}` || 'N/A',
            s.subject_name || 'N/A',
            `${s.period_name || 'N/A'} (${startTime})`,
            s.status || 'N/A'
          ];
        } catch (e) {
          console.error('Error mapping row:', s, e);
          return ['Error', 'Error', 'Error', 'Error', 'Error', 'Error', 'Error'];
        }
      });

      // 4. Call autoTable with fallbacks
      console.log('Calling autoTable...');
      const autoTableOptions = {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'striped',
        headStyles: { 
          fillColor: [0, 128, 0], // Green
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center'
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        alternateRowStyles: { fillColor: [240, 255, 240] }, // Very light green
        columnStyles: {
          0: { cellWidth: 25 },
          6: { halign: 'right' }
        }
      };

      // Try all common ways jspdf-autotable might be exposed
      autoTable(doc, autoTableOptions);

      // 5. Output
      if (outputType === 'preview') {
        console.log('Opening preview blob...');
        const blob = doc.output('bloburl');
        window.open(blob, '_blank');
        addNotification({ message: 'Opening report preview in a new tab...', type: 'info' });
      } else {
        console.log('Saving PDF...');
        doc.save(`Substitution_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        addNotification({ message: 'PDF Report downloaded successfully!', type: 'success' });
      }
    } catch (error) {
      console.error('CRITICAL PDF ERROR:', error);
      addNotification({ 
        message: 'Could not generate report: ' + error.message, 
        type: 'error',
        title: 'Export Failed'
      });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileText className="text-indigo-600" size={36} />
            Reports & Analytics
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Generate substitution summary reports and export as PDF.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <button 
            onClick={() => generatePDF('preview')}
            disabled={filteredData.length === 0 || errors.startDate || errors.endDate}
            title={filteredData.length === 0 ? "Adjust filters to show data before previewing" : "View report in new tab"}
            className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl border border-slate-200 hover:bg-slate-200 transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Search size={18} />
            Preview
          </button>
          <button 
            onClick={() => generatePDF('save')}
            disabled={filteredData.length === 0 || errors.startDate || errors.endDate}
            title={filteredData.length === 0 ? "Adjust filters to show data before downloading" : "Download PDF report"}
            className="flex-1 md:flex-none bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 font-black disabled:opacity-50 disabled:transform-none"
          >
            <Download size={20} />
            Download PDF
          </button>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white/50 backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={14} /> Start Date
              </label>
              <input 
                type="date" 
                className={`w-full bg-white rounded-2xl p-4 focus:ring-4 outline-none transition font-bold text-slate-700 shadow-sm border ${
                  errors.startDate 
                    ? 'border-rose-500 focus:ring-rose-500/10' 
                    : 'border-slate-200 focus:ring-indigo-500/10'
                }`}
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
              />
              {errors.startDate && <p className="text-rose-500 text-[10px] font-black uppercase tracking-tight ml-1 mt-1">{errors.startDate}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={14} /> End Date
              </label>
              <input 
                type="date" 
                className={`w-full bg-white rounded-2xl p-4 focus:ring-4 outline-none transition font-bold text-slate-700 shadow-sm border ${
                  errors.endDate 
                    ? 'border-rose-500 focus:ring-rose-500/10' 
                    : 'border-slate-200 focus:ring-indigo-500/10'
                }`}
                value={filters.endDate}
                onChange={e => setFilters({...filters, endDate: e.target.value})}
              />
              {errors.endDate && <p className="text-rose-500 text-[10px] font-black uppercase tracking-tight ml-1 mt-1">{errors.endDate}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Filter size={14} /> Status
              </label>
              <select 
                className="w-full border-slate-200 bg-white rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-bold text-slate-700 shadow-sm border appearance-none"
                value={filters.status}
                onChange={e => setFilters({...filters, status: e.target.value})}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Search size={14} /> Search Teacher/Subject
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Type to search..."
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
            <button onClick={() => { setFilters({startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], status: 'All', search: ''}); }} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-black uppercase hover:bg-rose-100 transition ml-auto">Reset Filters</button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900">Report Preview</h2>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter">
              {filteredData.length} Records Found
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              <p className="font-bold text-slate-400">Loading records...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="p-6">Date</th>
                  <th className="p-6">Absent Teacher</th>
                  <th className="p-6">Substitute Teacher</th>
                  <th className="p-6">Class/Subject</th>
                  <th className="p-6">Period</th>
                  <th className="p-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="text-sm font-black text-slate-900">{new Date(s.date).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(s.date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-bold text-slate-700">{s.absent_teacher_name}</div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
                          {s.substitute_teacher_name.charAt(0)}
                        </div>
                        <div className="text-sm font-bold text-indigo-600">{s.substitute_teacher_name}</div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-black text-slate-900">{s.subject_name}</div>
                      <div className="text-xs text-slate-400 font-bold">Grade {s.grade}-{s.section}</div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={14} className="text-slate-300" />
                        <span className="text-sm font-bold">{s.period_name}</span>
                        <span className="text-xs text-slate-400">({s.start_time.substring(0,5)})</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tighter inline-flex items-center gap-2 ${
                        s.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {s.status === 'Accepted' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-32 text-center">
                      <div className="max-w-xs mx-auto space-y-4">
                        <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[24px] flex items-center justify-center mx-auto">
                          <Search size={32} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-black text-slate-900 text-lg">No Results Found</h3>
                          <p className="text-slate-400 text-sm font-medium leading-relaxed">Adjust your filters or search terms to find what you're looking for.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubstitutionReports;
