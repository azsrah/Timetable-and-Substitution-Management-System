import React, { useState, useEffect } from 'react';
import TimetableGrid from '../../components/TimetableGrid';
import { Card, CardHeader, CardContent } from '../../components/Card';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';

const TimetableEditor = () => {
  const { addNotification } = useNotifications();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  const [periods, setPeriods] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [resources, setResources] = useState([]);

  const [isModalOpen, setModalOpen] = useState(false);
  const [slotForm, setSlotForm] = useState(null);

  useEffect(() => {
    const initFetch = async () => {
      try {
        const [clsRes, perRes, subRes, tRes, resRes] = await Promise.all([
          api.get('/classes'),
          api.get('/timetable/periods'), // newly added endpoint
          api.get('/subjects'),
          api.get('/users'),
          api.get('/resources')
        ]);
        setClasses(clsRes.data);
        setPeriods(perRes.data);
        setSubjects(subRes.data);
        setTeachers(tRes.data.filter(u => u.role === 'Teacher' && u.status === 'Active'));
        setResources(resRes.data);
        
        if (clsRes.data.length > 0) {
          setSelectedClass(clsRes.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    initFetch();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadTimetable(selectedClass);
    }
  }, [selectedClass]);

  const loadTimetable = async (classId) => {
    try {
      const { data } = await api.get(`/timetable/class/${classId}`);
      setTimetableData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSlotClick = (day, period, existingSlot) => {
    if (period.is_break) return;
    setSlotForm({
      class_id: selectedClass,
      day_of_week: day,
      period_id: period.id,
      subject_id: existingSlot ? existingSlot.subject_id : '',
      teacher_id: existingSlot ? existingSlot.teacher_id : '',
      resource_id: existingSlot && existingSlot.resource_id ? existingSlot.resource_id : ''
    });
    setModalOpen(true);
  };

  const handeSaveSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post('/timetable', slotForm);
      setModalOpen(false);
      addNotification({ message: 'Slot saved successfully!', type: 'success' });
      loadTimetable(selectedClass); // Reload grid
    } catch (err) {
      // Show conflict errors clearly!
      addNotification({ 
        message: err.response?.data?.message || 'Failed to save slot. Conflict detected.', 
        type: 'error',
        title: 'Schedule Conflict'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable Editor</h1>
          <p className="text-gray-500 mt-1">Drag, click, and assign schedule for each class. Auto-conflict detection enabled.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700">Select Class:</label>
          <select 
            className="border-gray-300 rounded-md shadow-sm p-2 w-48"
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
          >
            {classes.map(c => <option key={c.id} value={c.id}>Grade {c.grade}-{c.section}</option>)}
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <TimetableGrid 
            periods={periods} 
            timetableData={timetableData} 
            isEditMode={true} 
            onSlotClick={handleSlotClick} 
          />
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Assign Slot">
        {slotForm && (
          <form onSubmit={handeSaveSlot} className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500 bg-gray-50 p-3 rounded mb-4">
              <span>{slotForm.day_of_week}</span>
              <span>Period ID: {slotForm.period_id}</span>
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium">Subject *</label>
              <select required className="w-full border rounded p-2" value={slotForm.subject_id} onChange={e => setSlotForm({...slotForm, subject_id: e.target.value})}>
                <option value="">Select subject...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium">Teacher *</label>
              <select required className="w-full border rounded p-2" value={slotForm.teacher_id} onChange={e => setSlotForm({...slotForm, teacher_id: e.target.value})}>
                <option value="">Select teacher...</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium">Resource (Optional)</label>
              <select className="w-full border rounded p-2" value={slotForm.resource_id} onChange={e => setSlotForm({...slotForm, resource_id: e.target.value || null})}>
                <option value="">No special resource</option>
                {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">E.g., Physics Lab, Main Ground</p>
            </div>

            <div className="pt-4 border-t mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700">Save Assignment</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default TimetableEditor;
