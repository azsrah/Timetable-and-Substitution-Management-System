import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../../components/Card';
import { BookOpen } from 'lucide-react';
import api from '../../services/api';

import AnnouncementList from '../../components/AnnouncementList';

const StudentOverview = () => {
  const { user } = useAuth();
  const [todaySchedule, setTodaySchedule] = useState([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data } = await api.get(`/timetable/today/Student/${user.id}`);
        setTodaySchedule(data);
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchSchedule();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {user?.name}. Here's your schedule for today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="p-5 border-b border-slate-100">
               <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                 <BookOpen className="text-indigo-600" /> Today's Schedule
               </h2>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                {todaySchedule.length > 0 ? todaySchedule.map((slot, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-indigo-600 w-24 tracking-tight">{slot.start_time.substring(0,5)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900">{slot.subject_name}</div>
                        {slot.is_substituted && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Substituted</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">Teacher: {slot.teacher_name}</div>
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
      </div>
    </div>
  );
};

export default StudentOverview;
