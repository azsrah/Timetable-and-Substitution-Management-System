// ─────────────────────────────────────────────────────────
// AdminAttendance.jsx — Teacher Attendance Dashboard
// Allows the admin to view teacher check-in/check-out records
// for any specific date.
// Includes quick stats (Total, Present, Absent) and a searchable,
// filterable data table. Calculates the exact duration a teacher
// was present.
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardContent, CardHeader } from '../../components/Card';
import { UserCheck, Search, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]); // Raw records from the server
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default: Today
  const [searchTerm, setSearchTerm] = useState('');     // For searching by name/email
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Present', or 'Absent'
  const { addNotification } = useNotifications();

  // ── fetchAttendance ─────────────────────────────────────
  // Fetches records for the currently selected date.
  // Re-runs automatically whenever 'date' changes.
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/attendance?date=${date}`);
        setAttendance(res.data);
      } catch (err) {
        addNotification({ message: 'Failed to fetch attendance records', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [date, addNotification]);

  // ── Derived State ───────────────────────────────────────
  // Calculate summary counts from the raw data
  const presentCount = attendance.filter(r => r.status === 'Present').length;
  const absentCount = attendance.filter(r => r.status === 'Absent').length;
  const totalCount = attendance.length;

  // Apply search query and status filter to the raw data before rendering
  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = record.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.teacher_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filterButtons = [
    { label: 'All', value: 'All',    count: totalCount,   activeClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200',   inactiveClass: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50' },
    { label: 'Present', value: 'Present', count: presentCount, activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200', inactiveClass: 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700' },
    { label: 'Absent',  value: 'Absent',  count: absentCount,  activeClass: 'bg-rose-500 text-white shadow-lg shadow-rose-200',     inactiveClass: 'bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teacher Attendance</h1>
          <p className="text-slate-500 mt-1 font-medium">View and monitor daily teacher check-in/out records.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Pill Filters moved to top near date */}
          <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            {filterButtons.map(btn => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                  statusFilter === btn.value ? btn.activeClass : btn.inactiveClass
                }`}
              >
                {btn.label}
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                  statusFilter === btn.value ? 'bg-white/20' : 'bg-slate-200 text-slate-500'
                }`}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <Calendar size={18} className="text-indigo-600" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-none focus:ring-0 text-slate-700 font-bold outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Users size={22} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</p>
            <p className="text-3xl font-black text-slate-900 leading-none mt-0.5">{loading ? '—' : totalCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Present</p>
            <p className="text-3xl font-black text-emerald-600 leading-none mt-0.5">{loading ? '—' : presentCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
            <XCircle size={22} className="text-rose-500" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Absent</p>
            <p className="text-3xl font-black text-rose-500 leading-none mt-0.5">{loading ? '—' : absentCount}</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <UserCheck size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Attendance Log</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  {new Date(date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>
            </div>

            {/* Right: Search */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 bg-white"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-50">
                <tr>
                  <th className="px-8 py-5">Teacher</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Check-In</th>
                  <th className="px-8 py-5">Check-Out</th>
                  <th className="px-8 py-5 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="inline-block w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold text-sm mt-3">Loading records...</p>
                    </td>
                  </tr>
                ) : filteredAttendance.length > 0 ? (
                  filteredAttendance.map((record) => {
                    // Helper to calculate total hours and minutes a teacher worked
                    const calculateDuration = () => {
                      if (!record.check_in_time || !record.check_out_time) return null;
                      const start = new Date(`1970-01-01T${record.check_in_time}`);
                      const end = new Date(`1970-01-01T${record.check_out_time}`);
                      const diff = (end - start) / 1000 / 60; // Diff in minutes
                      const h = Math.floor(diff / 60);
                      const m = Math.floor(diff % 60);
                      return `${h}h ${m}m`;
                    };
                    const duration = calculateDuration();

                    return (
                      <tr key={record.user_id || record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-black text-slate-900 leading-tight">{record.teacher_name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{record.teacher_email}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-widest border ${
                            record.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : record.status === 'Absent'
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              record.status === 'Present' ? 'bg-emerald-500' : record.status === 'Absent' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}></span>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-mono text-sm font-bold text-slate-600">
                          {record.check_in_time ? record.check_in_time.substring(0, 5) : <span className="text-slate-200 font-normal">--:--</span>}
                        </td>
                        <td className="px-8 py-6 font-mono text-sm font-bold text-slate-600">
                          {record.check_out_time ? record.check_out_time.substring(0, 5) : <span className="text-slate-200 font-normal">--:--</span>}
                        </td>
                        <td className="px-8 py-6 text-right">
                          {duration
                            ? <span className="font-black text-indigo-600 tabular-nums">{duration}</span>
                            : <span className="text-slate-200">—</span>
                          }
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <UserCheck size={28} className="text-slate-200" />
                      </div>
                      <p className="font-black text-slate-400">No teachers match your filter</p>
                      <p className="text-xs text-slate-300 font-medium mt-1">Try changing the status filter or date.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAttendance;
