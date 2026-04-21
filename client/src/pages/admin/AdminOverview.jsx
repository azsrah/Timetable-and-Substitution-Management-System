// ─────────────────────────────────────────────────────────
// AdminOverview.jsx — Admin Dashboard Home Page
// Displays high-level school statistics (teacher count, student
// count, class count) and a list of recent announcements.
// Also provides quick-access buttons to manage substitutions
// and create new announcements via a modal form.
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/Card';
import { Users, UserCheck, BookOpen, Clock, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import AnnouncementList from '../../components/AnnouncementList';
import Modal from '../../components/Modal';

const AdminOverview = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  // Counts displayed on the stat cards
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls the Create Announcement modal
  const [annForm, setAnnForm] = useState({ title: '', message: '', target_audience: 'All' });

  // ── fetchStats ───────────────────────────────────────────
  // Fetches all users and classes to calculate the dashboard summary numbers.
  // Counts how many teachers and students exist, plus total classes.
  const fetchStats = async () => {
    try {
      const { data: users } = await api.get('/users');
      const { data: classes } = await api.get('/classes');
      setStats({
        teachers: users.filter(u => u.role === 'Teacher').length,
        students: users.filter(u => u.role === 'Student').length,
        classes: classes.length
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Load stats when the component first renders
  useEffect(() => {
    fetchStats();
  }, []);

  // ── handleCreateAnnouncement ─────────────────────────────
  // Submits the new announcement form data to the API,
  // then closes the modal and refreshes the page to show the new item.
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', annForm);
      setIsModalOpen(false);
      setAnnForm({ title: '', message: '', target_audience: 'All' }); // Reset form
      addNotification({ message: 'Announcement published!', type: 'success' });
      // Reload the page after a short delay so the new announcement appears in the list
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      addNotification({ message: 'Failed to create announcement.', type: 'error' });
    }
  };

  const statCards = [
    { title: 'Total Teachers', value: stats.teachers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Total Students', value: stats.students, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Active Classes', value: stats.classes, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Substitutions', value: 'Check', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
          
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/admin/substitutions')}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 font-bold"
          >
            <Clock size={18} />
            Manage Substitutions
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-slate-100 hover:bg-slate-900 transition-all transform hover:-translate-y-0.5 font-bold"
          >
            Create Announcement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 py-8">
              <div className={`p-4 rounded-full ${stat.bg} ${stat.color}`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h4 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h4>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-4">
           <h2 className="text-xl font-bold text-gray-800">Recent Announcements</h2>
           <AnnouncementList isAdminView={true} />
         </div>
         
         <div className="space-y-4">
           <h2 className="text-xl font-bold text-gray-800">System Activity</h2>
           <Card>
             <CardContent className="p-4 space-y-4">
               <div className="text-sm text-gray-500 italic">Recent logs will appear here.</div>
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
            <select className="w-full border rounded p-2 mt-1" value={annForm.target_audience} onChange={e => setAnnForm({...annForm, target_audience: e.target.value})}>
              <option value="All">All Users</option>
              <option value="Teachers">Teachers Only</option>
              <option value="Students">Students Only</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg mt-4 font-bold hover:bg-indigo-700 transition">
            Publish Now
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminOverview;
