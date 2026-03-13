import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/Card';
import { BookOpen } from 'lucide-react';
import api from '../../services/api';

import AnnouncementList from '../../components/AnnouncementList';

const StudentOverview = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {user?.name}. Check your announcements below.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2 text-gray-800">
             <BookOpen className="text-indigo-600" /> Announcements
          </h2>
          <AnnouncementList />
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
