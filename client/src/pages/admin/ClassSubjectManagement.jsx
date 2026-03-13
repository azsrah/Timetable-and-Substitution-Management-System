import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../components/Card';
import Modal from '../../components/Modal';
import api from '../../services/api';

const ClassSubjectManagement = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Modals state
  const [isClassOpen, setClassOpen] = useState(false);
  const [isSubjectOpen, setSubjectOpen] = useState(false);
  const [isAssignOpen, setAssignOpen] = useState(false);

  // Form states
  const [classForm, setClassForm] = useState({ grade: 6, section: 'A', room_number: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '' });
  const [assignForm, setAssignForm] = useState({ class_id: '', subject_id: '', assigned_teacher_id: '' });

  const fetchData = async () => {
    try {
      const [clsRes, subRes, usersRes] = await Promise.all([
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/users')
      ]);
      setClasses(clsRes.data);
      setSubjects(subRes.data);
      setTeachers(usersRes.data.filter(u => u.role === 'Teacher' && u.status === 'Active'));
    } catch (err) {
      alert('Error fetching data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes', classForm);
      setClassOpen(false);
      fetchData();
    } catch (err) { alert('Failed to create class'); }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subjects', subjectForm);
      setSubjectOpen(false);
      fetchData();
    } catch (err) { alert('Failed to create subject'); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/classes/${assignForm.class_id}/subjects`, assignForm);
      setAssignOpen(false);
      alert('Subject successfully assigned to class!');
    } catch (err) { alert('Failed to assign subject'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes & Subjects</h1>
          <p className="text-gray-500 mt-1">Manage school classes and assign default teachers to subjects.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setClassOpen(true)} className="bg-white border text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 flex items-center justify-center transition">
            + New Class
          </button>
          <button onClick={() => setSubjectOpen(true)} className="bg-white border text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 flex items-center justify-center transition">
            + New Subject
          </button>
          <button onClick={() => setAssignOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 flex items-center justify-center transition">
            Assign Subject to Class
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="All Classes" />
          <CardContent className="h-96 overflow-y-auto p-0">
            <ul className="divide-y divide-gray-100">
              {classes.map(c => (
                <li key={c.id} className="p-4 flex justify-between hover:bg-gray-50">
                  <span className="font-medium text-gray-900">Grade {c.grade} - {c.section}</span>
                  <span className="text-gray-500 text-sm">Room: {c.room_number || 'N/A'}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="All Subjects" />
          <CardContent className="h-96 overflow-y-auto p-0">
            <ul className="divide-y divide-gray-100">
              {subjects.map(s => (
                <li key={s.id} className="p-4 flex justify-between hover:bg-gray-50">
                  <span className="font-medium text-gray-900">{s.name}</span>
                  <span className="text-gray-500 text-sm font-mono border px-1 rounded">{s.code}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <Modal isOpen={isClassOpen} onClose={() => setClassOpen(false)} title="Create New Class">
        <form onSubmit={handleCreateClass} className="space-y-4">
          <div><label className="block text-sm mb-1">Grade (6-9)</label><input type="number" min="6" max="9" required className="w-full border rounded p-2" value={classForm.grade} onChange={e => setClassForm({...classForm, grade: Number(e.target.value)})} /></div>
          <div><label className="block text-sm mb-1">Section</label><input required className="w-full border rounded p-2" value={classForm.section} onChange={e => setClassForm({...classForm, section: e.target.value})} /></div>
          <div><label className="block text-sm mb-1">Room Number</label><input className="w-full border rounded p-2" value={classForm.room_number} onChange={e => setClassForm({...classForm, room_number: e.target.value})} /></div>
          <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded mt-4">Save Class</button>
        </form>
      </Modal>

      <Modal isOpen={isSubjectOpen} onClose={() => setSubjectOpen(false)} title="Create New Subject">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div><label className="block text-sm mb-1">Subject Name</label><input required className="w-full border rounded p-2" value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} /></div>
          <div><label className="block text-sm mb-1">Subject Code</label><input required className="w-full border rounded p-2" value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})} /></div>
          <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded mt-4">Save Subject</button>
        </form>
      </Modal>

      <Modal isOpen={isAssignOpen} onClose={() => setAssignOpen(false)} title="Assign Subject to Class">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Class</label>
            <select required className="w-full border rounded p-2" onChange={e => setAssignForm({...assignForm, class_id: e.target.value})}>
              <option value="">Select a class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>Grade {c.grade}-{c.section}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Subject</label>
            <select required className="w-full border rounded p-2" onChange={e => setAssignForm({...assignForm, subject_id: e.target.value})}>
              <option value="">Select a subject...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Default Teacher (Optional)</label>
            <select className="w-full border rounded p-2" onChange={e => setAssignForm({...assignForm, assigned_teacher_id: e.target.value || null})}>
              <option value="">None</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded mt-4">Assign</button>
        </form>
      </Modal>
    </div>
  );
};

export default ClassSubjectManagement;
