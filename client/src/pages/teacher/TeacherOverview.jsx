import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../../components/Card';
import { Calendar, Clock } from 'lucide-react';
import api from '../../services/api';
import AnnouncementList from '../../components/AnnouncementList';

import Modal from '../../components/Modal';

const TeacherOverview = () => {
  const { user } = useAuth();
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [annForm, setAnnForm] = useState({ title: '', message: '', target_audience: 'All', target_class_ids: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedRes, clsRes] = await Promise.all([
          api.get(`/timetable/teacher/${user.id}`),
          api.get('/classes')
        ]);
        const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        setTodaySchedule(schedRes.data.filter(s => s.day_of_week === day));
        setClasses(clsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchData();
  }, [user?.id]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      if (annForm.target_audience === 'Specific' && annForm.target_class_ids.length === 0) {
        alert('Please select at least one class');
        return;
      }
      
      await api.post('/announcements', {
        ...annForm,
        target_audience: annForm.target_audience === 'Specific' ? 'Students' : annForm.target_audience
      });
      setIsModalOpen(false);
      setAnnForm({ title: '', message: '', target_audience: 'All', target_class_ids: [] });
      window.location.reload(); 
    } catch (err) {
      alert('Failed to create announcement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}. Here's your agenda.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition font-medium"
        >
          Send Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="text-indigo-600" /> Today's Schedule
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaySchedule.length > 0 ? todaySchedule.map((slot, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-indigo-600 w-24">{slot.start_time.substring(0,5)}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{slot.subject_name}</div>
                      <div className="text-sm text-gray-500">Class: {slot.grade}{slot.section}</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-gray-500 italic p-4 text-center">No classes scheduled for today.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
             <h2 className="text-xl font-bold text-gray-800">Recent Announcements</h2>
             <AnnouncementList />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="text-indigo-600" /> Pending Actions
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Check your substitutions and resource requests.</p>
                <div className="flex flex-col gap-2">
                   <a href="/teacher/substitutions" className="p-3 bg-amber-50 text-amber-900 rounded-lg text-sm font-medium border border-amber-100">View Substitution Requests</a>
                   <a href="/teacher/requests" className="p-3 bg-indigo-50 text-indigo-900 rounded-lg text-sm font-medium border border-indigo-100">View Resource Bookings</a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Announcement">
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input required className="w-full border rounded p-2 mt-1" value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea required rows="4" className="w-full border rounded p-2 mt-1" value={annForm.message} onChange={e => setAnnForm({...annForm, message: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Target Audience</label>
            <select className="w-full border rounded p-2 mt-1" value={annForm.target_audience} onChange={e => setAnnForm({...annForm, target_audience: e.target.value, target_class_ids: []})}>
              <option value="All">All Users</option>
              <option value="Teachers">Teachers Only</option>
              <option value="Students">All Students</option>
              <option value="Specific">Specific Classes</option>
            </select>
          </div>
          
          {annForm.target_audience === 'Specific' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 max-h-40 overflow-y-auto">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Classes</label>
              <div className="grid grid-cols-2 gap-2">
                {classes.map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-indigo-600 transition">
                    <input 
                      type="checkbox" 
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                      checked={annForm.target_class_ids.includes(c.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked 
                          ? [...annForm.target_class_ids, c.id]
                          : annForm.target_class_ids.filter(id => id !== c.id);
                        setAnnForm({ ...annForm, target_class_ids: newIds });
                      }}
                    />
                    Gr {c.grade} ({c.section})
                  </label>
                ))}
              </div>
            </div>
          )}
          <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg mt-4 font-bold hover:bg-indigo-700 transition">
            Publish Announcement
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherOverview;
