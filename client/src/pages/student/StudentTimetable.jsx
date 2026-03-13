import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TimetableGrid from '../../components/TimetableGrid';
import api from '../../services/api';

const StudentTimetable = () => {
  const { user } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const { data } = await api.get('/timetable/periods');
        setPeriods(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (!user?.class_id) return;
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/timetable/class/${user.class_id}`);
        setTimetableData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 animate-pulse font-medium">Loading your timetable...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Class Timetable</h1>
        <p className="text-gray-500 mt-1">Weekly schedule for your assigned class.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2">
        <TimetableGrid 
          periods={periods} 
          timetableData={timetableData} 
          isEditMode={false} 
        />
      </div>
    </div>
  );
};

export default StudentTimetable;
