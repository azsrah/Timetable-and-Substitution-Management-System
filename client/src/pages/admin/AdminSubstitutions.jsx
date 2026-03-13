import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/Card';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { UserMinus, CheckCircle, Clock } from 'lucide-react';

const AdminSubstitutions = () => {
  const [substitutions, setSubstitutions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [suggestions, setSuggestions] = useState({}); // periodId -> [teachers]

  const fetchSubstitutions = async () => {
    try {
      const { data } = await api.get('/attendance/substitutions');
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
  }, []);

  const loadSchedule = async () => {
    if (!selectedTeacher || !selectedDate) return;
    try {
      const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'Long' });
      const { data } = await api.get(`/timetable/teacher/${selectedTeacher}`);
      // Filter for the selected day
      const daySchedule = data.filter(s => s.day_of_week === dayName);
      setTeacherSchedule(daySchedule);
      
      // For each period in schedule, fetch suggestions
      const newSuggestions = {};
      for (const slot of daySchedule) {
        const res = await api.get(`/attendance/suggest?day_of_week=${dayName}&period_id=${slot.period_id}`);
        newSuggestions[slot.period_id] = res.data;
      }
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (slot, substituteId) => {
    if (!substituteId) return;
    try {
      await api.post('/attendance/substitute', {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Substitution Management</h1>
          <p className="text-gray-500 mt-1">Assign substitutes for absent teachers</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <UserMinus size={18} />
          Mark Absence
        </button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Absent Teacher</th>
                <th className="p-4">Substitute</th>
                <th className="p-4">Class</th>
                <th className="p-4">Period</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {substitutions.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="p-4">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-gray-900">{s.absent_teacher_name}</td>
                  <td className="p-4 text-indigo-600 font-medium">{s.substitute_teacher_name}</td>
                  <td className="p-4">{s.grade}{s.section} - {s.subject_name}</td>
                  <td className="p-4">{s.period_name} ({s.start_time.substring(0,5)})</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${s.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {substitutions.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 italic">No substitutions active</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Mark Teacher Absence">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher</label>
              <select 
                className="w-full border rounded p-2" 
                value={selectedTeacher}
                onChange={e => setSelectedTeacher(e.target.value)}
              >
                <option value="">Select Teacher...</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                className="w-full border rounded p-2" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            onClick={loadSchedule}
            disabled={!selectedTeacher}
            className="w-full bg-slate-800 text-white p-2 rounded hover:bg-slate-900 transition disabled:opacity-50"
          >
            Check Schedule
          </button>

          {teacherSchedule.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Schedule for {selectedDate}</h3>
              <div className="space-y-3">
                {teacherSchedule.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                    <div>
                      <div className="text-sm font-bold">{slot.period_name} ({slot.start_time.substring(0,5)})</div>
                      <div className="text-xs text-gray-500">{slot.grade}{slot.section} - {slot.subject_name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                       <select 
                         className="text-xs border rounded p-1 w-40"
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
