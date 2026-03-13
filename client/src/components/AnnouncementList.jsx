import React, { useState, useEffect } from 'react';
import { Megaphone, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AnnouncementList = ({ isAdminView = false }) => {
  const [announcements, setAnnouncements] = useState([]);
  const { user } = useAuth();

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      {announcements.map(ann => (
        <div key={ann.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition group">
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 h-fit">
                <Megaphone size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-slate-800">{ann.title}</h4>
                  {ann.author_name && (
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                      by {ann.author_name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {ann.message}
                </p>
                <div className="flex items-center gap-3 mt-3">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">
                     {new Date(ann.created_at).toLocaleDateString()}
                   </span>
                   <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                     ann.target_audience === 'All' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'
                   }`}>
                     For: {ann.target_audience} {ann.target_class_id ? `(Class ${ann.target_class_id})` : ''}
                   </span>
                </div>
              </div>
            </div>
            {isAdminView && (
              <button 
                onClick={() => handleDelete(ann.id)}
                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
      {announcements.length === 0 && (
        <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-xl border-2 border-dashed border-slate-100">
          No active announcements
        </div>
      )}
    </div>
  );
};

export default AnnouncementList;
