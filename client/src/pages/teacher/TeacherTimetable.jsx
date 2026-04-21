// ─────────────────────────────────────────────────────────
// TeacherTimetable.jsx — Weekly View
// Renders the global TimetableGrid component, but limits the
// fetched data strictly to the logged-in teacher's schedule.
// ─────────────────────────────────────────────────────────

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
          api.get(`/timetable/teacher/${user.id}`) // Scoped to this teacher ONLY
        ]);
        setPeriods(perRes.data);
        
        // ── Formatting for Grid ─────────────────────────────────
        // The standard TimetableGrid assumes it's displaying a CLASS schedule,
        // so it renders the 'teacher_name' at the bottom of the slot.
        // Since the teacher knows their own name, we overwrite 'teacher_name'
        // with the Class/Section so the teacher sees *who* they are teaching.
        const formatForGrid = ttRes.data.map(slot => ({
          ...slot,
          teacher_name: `Grade ${slot.grade}-${slot.section}` 
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
