import React, { useState, useEffect } from 'react';
import AnnouncementList from '../../components/AnnouncementList';
import { Megaphone, Plus } from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Announcements = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [annForm, setAnnForm] = useState({ title: '', message: '', target_audience: 'All', target_class_ids: [] });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await api.get('/classes');
        setClasses(data);
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.role === 'Teacher' || user?.role === 'Admin') {
      fetchClasses();
    }
  }, [user]);

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
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-500 mt-1">Stay updated with the latest school news.</p>
        </div>
        {(user?.role === 'Teacher' || user?.role === 'Admin') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition font-bold flex items-center gap-2"
          >
            <Plus size={18} /> New Announcement
          </button>
        )}
      </div>

      <div className="max-w-4xl">
        <AnnouncementList />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Announcement">
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
          <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-xl mt-4 font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
            Publish Now
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Announcements;
