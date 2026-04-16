import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardContent, CardHeader } from '../../components/Card';
import { UserCheck, Search, Calendar, Filter } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchAttendance();
  }, [date]);

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

  const filteredAttendance = attendance.filter(record => 
    record.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.teacher_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Attendance</h1>
          <p className="text-gray-500 mt-1">View and monitor daily teacher check-in/out records.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar size={18} className="text-indigo-600 ml-2" />
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="border-none focus:ring-0 text-gray-700 font-medium"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <UserCheck className="text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-800">Attendance Log for {new Date(date).toLocaleDateString()}</h2>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search teacher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-400">Teacher</th>
                  <th className="px-6 py-4 font-bold text-gray-400">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-400">Check-In</th>
                  <th className="px-6 py-4 font-bold text-gray-400">Check-Out</th>
                  <th className="px-6 py-4 font-bold text-gray-400">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 italic">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400">Loading records...</td>
                  </tr>
                ) : filteredAttendance.length > 0 ? (
                  filteredAttendance.map((record) => {
                    const calculateDuration = () => {
                      if (!record.check_in_time || !record.check_out_time) return '-';
                      const start = new Date(`1970-01-01T${record.check_in_time}`);
                      const end = new Date(`1970-01-01T${record.check_out_time}`);
                      const diff = (end - start) / 1000 / 60; // in minutes
                      const h = Math.floor(diff / 60);
                      const m = Math.floor(diff % 60);
                      return `${h}h ${m}m`;
                    };

                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-800">{record.teacher_name}</div>
                          <div className="text-xs text-gray-500">{record.teacher_email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                            record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-indigo-600">
                          {record.check_in_time ? record.check_in_time.substring(0, 5) : '-'}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-orange-600">
                          {record.check_out_time ? record.check_out_time.substring(0, 5) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {calculateDuration()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400">No attendance records found for this date.</td>
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
