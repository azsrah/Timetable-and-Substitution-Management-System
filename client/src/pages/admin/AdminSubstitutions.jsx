import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/Card';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { UserMinus, CheckCircle, Clock } from 'lucide-react';

import { useLocation } from 'react-router-dom';

const AdminSubstitutions = () => {
  const location = useLocation();

  const [substitutions, setSubstitutions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [suggestions, setSuggestions] = useState({}); // periodId -> [teachers]

  const fetchSubstitutions = async () => {
    try {
      const { data } = await api.get('/substitutions/all');
      setSubstitutions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/users');
      setTeachers(data.filter(u => u.role === 'Teacher'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubstitutions();
    fetchTeachers();
    
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      setIsModalOpen(true);
    }
  }, [location.search]);

  const loadSchedule = async () => {
    if (!selectedTeacher || !selectedDate) return;
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      
      const { data } = await api.get(`/timetable/teacher/${selectedTeacher}`);
      const daySchedule = data.filter(s => s.day_of_week.toLowerCase() === dayName.toLowerCase());
      
      if (daySchedule.length === 0) {
        alert('No schedule found for this teacher on ' + dayName);
        setTeacherSchedule([]);
        return;
      }

      setTeacherSchedule(daySchedule);
      
      const suggestionPromises = daySchedule.map(slot => 
        api.get(`/substitutions/suggest?day_of_week=${slot.day_of_week}&period_id=${slot.period_id}`)
          .then(res => ({ periodId: slot.period_id, data: res.data }))
      );
      
      const results = await Promise.all(suggestionPromises);
      const newSuggestions = {};
      results.forEach(res => {
        newSuggestions[res.periodId] = res.data;
      });
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error(err);
      alert('Failed to load schedule.');
    }
  };

  const handleAssign = async (slot, substituteId) => {
    if (!substituteId) return;
    try {
      await api.post('/substitutions/assign', {
        absent_teacher_id: selectedTeacher,
        substitute_teacher_id: substituteId,
        timetable_id: slot.id,
        date: selectedDate
      });
      alert('Substitution assigned');
      fetchSubstitutions();
    } catch (err) {
      alert('Failed to assign');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Substitution Management</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 font-bold"
        >
          <Clock size={20} />
          Create Substitution
        </button>
      </div>

      <div className="text-center py-2">
        <p className="text-slate-500 font-medium tracking-wide">Assign substitutes for absent teachers</p>
      </div>

      <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-6">Date</th>
                <th className="p-6">Absent Teacher</th>
                <th className="p-6">Substitute</th>
                <th className="p-6">Class</th>
                <th className="p-6">Period</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {substitutions.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="p-6 text-slate-600 font-medium">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="p-6 font-bold text-slate-900">{s.absent_teacher_name}</td>
                  <td className="p-6 text-indigo-600 font-bold">{s.substitute_teacher_name}</td>
                  <td className="p-6 font-medium text-slate-700">{s.grade}{s.section}</td>
                  <td className="p-6 font-medium text-slate-700">{s.period_name} ({s.start_time.substring(0,5)})</td>
                  <td className="p-6 text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter ${s.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {substitutions.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-20 text-center text-slate-400 italic font-medium">
                    No substitutions active
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Mark Teacher Absence">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Teacher</label>
              <select 
                className="w-full border-slate-200 bg-slate-50 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium text-slate-700 appearance-none" 
                value={selectedTeacher}
                onChange={e => setSelectedTeacher(e.target.value)}
              >
                <option value="">Choose a teacher...</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Date of Absence</label>
              <input 
                type="date" 
                className="w-full border-slate-200 bg-slate-50 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium text-slate-700" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            onClick={loadSchedule}
            disabled={!selectedTeacher}
            className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200 disabled:opacity-30 disabled:shadow-none transform active:scale-[0.98]"
          >
            Check Available Schedule
          </button>

          {teacherSchedule.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-900 text-lg">Daily Schedule</h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long' })}</span>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {teacherSchedule.map(slot => (
                  <div key={slot.id} className="group flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl font-bold text-sm">
                        {slot.start_time.substring(0,5)}
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">{slot.subject_name}</div>
                        <div className="text-xs text-slate-500 font-medium">Gr {slot.grade} ({slot.section}) • {slot.period_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <select 
                         className="text-xs border-slate-200 bg-slate-50 rounded-lg p-2 w-44 font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                         onChange={(e) => handleAssign(slot, e.target.value)}
                         defaultValue=""
                       >
                         <option value="" disabled>Assign Substitute...</option>
                         {(suggestions[slot.period_id] || []).map(adv => (
                           <option key={adv.id} value={adv.id}>{adv.name}</option>
                         ))}
                       </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminSubstitutions;
