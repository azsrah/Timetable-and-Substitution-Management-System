import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../components/Card';
import api from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { Check, X } from 'lucide-react';

const ResourceApprovals = () => {
  const { addNotification } = useNotifications();
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/resources/requests');
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/resources/requests/${id}`, { status });
      addNotification({ message: `Request ${status.toLowerCase()}!`, type: 'success' });
      fetchRequests();
    } catch (err) {
      addNotification({ message: 'Failed to update status.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resource Approvals</h1>
        <p className="text-gray-500 mt-1">Review and manage lab, auditorium, and ground requests.</p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
              <tr>
                <th className="p-4">Teacher</th>
                <th className="p-4">Resource</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-gray-900">{req.teacher_name}</td>
                  <td className="p-4">
                    {req.resource_name} 
                    <span className="block text-xs text-gray-400">{req.resource_type}</span>
                  </td>
                  <td className="p-4">
                    {new Date(req.date).toLocaleDateString()}
                    <span className="block text-xs text-gray-500">{req.period_name}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium 
                      ${req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                        'bg-amber-100 text-amber-700'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {req.status === 'Pending' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleStatusUpdate(req.id, 'Approved')}
                          className="bg-green-100 text-green-700 p-1.5 rounded hover:bg-green-200 transition"
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(req.id, 'Rejected')}
                          className="bg-red-100 text-red-700 p-1.5 rounded hover:bg-red-200 transition"
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No resource requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceApprovals;
