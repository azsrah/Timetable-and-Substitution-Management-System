import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../components/Card';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const ResourceRequests = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [resources, setResources] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ resource_id: '', date: '', period_id: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resReq, pfcReq] = await Promise.all([
        api.get('/resources'),
        api.get('/timetable/periods'),
      ]);
      setResources(resReq.data);
      setPeriods(pfcReq.data.filter(p => !p.is_break));
      await fetchMyRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const { data } = await api.get('/resources/my-requests');
      setMyRequests(data);
    } catch (err) {
      console.error('Failed to fetch request history:', err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/resources/requests', formData);
      setModalOpen(false);
      addNotification({ message: 'Request submitted for approval!', type: 'success' });
      fetchMyRequests(); // Refresh history
      setFormData({ resource_id: '', date: '', period_id: '' });
    } catch (err) {
      addNotification({ message: 'Failed to submit request.', type: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Resource Requests</h1>
          <p className="text-slate-500 mt-1 font-medium">Book labs, auditoriums, and grounds for specific periods.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition transform hover:-translate-y-0.5 font-bold flex items-center gap-2"
        >
          <span className="text-xl">+</span> New Request
        </button>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900">Request History</h2>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              <p className="font-bold text-slate-400">Loading history...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-900">No requests found</h3>
                <p className="text-slate-400 text-sm font-medium">Your resource booking history will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-50">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Resource</th>
                    <th className="px-8 py-5">Period</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {myRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="text-sm font-black text-slate-900">{new Date(req.date).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(req.date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-slate-700">{req.resource_name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{req.resource_type}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-slate-600">{req.period_name}</div>
                        <div className="text-xs text-slate-400 font-medium">{req.start_time?.substring(0, 5)}</div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tighter border inline-block ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Request Resource">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
            <select required className="w-full border p-2 rounded" value={formData.resource_id} onChange={e => setFormData({...formData, resource_id: e.target.value})}>
              <option value="">Select resource...</option>
              {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input required type="date" className="w-full border p-2 rounded" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select required className="w-full border p-2 rounded" value={formData.period_id} onChange={e => setFormData({...formData, period_id: e.target.value})}>
              <option value="">Select period...</option>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.start_time.substring(0,5)})</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded mt-4">Submit Request</button>
        </form>
      </Modal>
    </div>
  );
};

export default ResourceRequests;
