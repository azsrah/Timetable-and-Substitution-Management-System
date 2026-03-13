import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TimetableGrid from '../../components/TimetableGrid';
import api from '../../services/api';

const TeacherTimetable = () => {
  const { user } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [timetableData, setTimetableData] = useState([]);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const [perRes, ttRes] = await Promise.all([
          api.get('/timetable/periods'),
          api.get(`/timetable/teacher/${user.id}`)
        ]);
        setPeriods(perRes.data);
        
        // Ensure timetableData mimics what TimetableGrid expects: subject_name and teacher_name (can use class/section instead here)
        const formatForGrid = ttRes.data.map(slot => ({
          ...slot,
          teacher_name: `Grade ${slot.grade}-${slot.section}` // Display class instead of teacher string in grid
        }));
        setTimetableData(formatForGrid);
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchTimetable();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
        <p className="text-gray-500 mt-1">Your weekly schedule.</p>
      </div>
      <TimetableGrid 
        periods={periods} 
        timetableData={timetableData} 
        isEditMode={false} 
      />
    </div>
  );
};

export default TeacherTimetable;
