import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/Card';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Check, X, Clock } from 'lucide-react';

const TeacherSubstitutions = () => {
  const { user } = useAuth();
  const [substitutions, setSubstitutions] = useState([]);

  const fetchSubstitutions = async () => {
    try {
      const { data } = await api.get(`/substitutions/teacher/${user.id}`);
      setSubstitutions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubstitutions();
  }, [user.id]);

  const handleAccept = async (id) => {
    try {
      await api.put(`/substitutions/${id}/accept`);
      fetchSubstitutions();
    } catch (err) {
      alert('Failed to accept');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Substitution Requests</h1>
        <p className="text-gray-500 mt-1">Review and accept your substitution duties</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {substitutions.map(s => (
          <Card key={s.id} className={s.status === 'Accepted' ? 'border-green-200 bg-green-50/30' : 'border-indigo-100'}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-600 text-white p-2 rounded shadow-sm">
                  <Clock size={20} />
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${s.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {s.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Date & Time</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {new Date(s.date).toLocaleDateString()} | {s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Class</div>
                    <div className="text-sm text-gray-900">{s.grade}{s.section}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Subject</div>
                    <div className="text-sm text-gray-900">{s.subject_name}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 font-medium">Substitute for</div>
                  <div className="text-sm text-gray-900">{s.absent_teacher_name}</div>
                </div>
              </div>

              {s.status === 'Pending' && (
                <div className="mt-6">
                  <button 
                    onClick={() => handleAccept(s.id)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <Check size={18} />
                    Accept Assignment
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {substitutions.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border-2 border-dashed border-slate-200">
             <div className="mx-auto w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <Clock size={24} />
             </div>
             <h3 className="text-lg font-medium text-slate-900">No requests</h3>
             <p className="text-slate-500">You don't have any pending substitution duties.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSubstitutions;
