import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/Card';
import Modal from '../../components/Modal';
import api from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('Teachers'); // 'Teachers' or 'Students'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', is_temporary_teacher: false });

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      alert('Error fetching users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/teacher', formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', is_temporary_teacher: false });
      fetchUsers();
    } catch (err) {
      alert('Failed to add teacher');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/users/${id}/status`, { status });
      fetchUsers();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => u.role === (activeTab === 'Teachers' ? 'Teacher' : 'Student'));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage Teachers and Students</p>
        </div>
        {activeTab === 'Teachers' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
          >
            + Add Teacher
          </button>
        )}
      </div>

      <div className="flex border-b">
        <button 
          className={`px-6 py-3 font-medium text-sm transition ${activeTab === 'Teachers' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('Teachers')}
        >
          Teachers
        </button>
        <button 
          className={`px-6 py-3 font-medium text-sm transition ${activeTab === 'Students' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('Students')}
        >
          Students
        </button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-gray-900">
                    {u.name} {u.is_temporary_teacher ? <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Temp</span> : ''}
                  </td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">{u.role}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {u.status === 'Inactive' && (
                      <button onClick={() => handleStatusChange(u.id, 'Active')} className="text-green-600 hover:underline">Approve</button>
                    )}
                    {u.status === 'Active' && (
                      <button onClick={() => handleStatusChange(u.id, 'Inactive')} className="text-amber-600 hover:underline">Suspend</button>
                    )}
                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Teacher">
        <form onSubmit={handleAddTeacher} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input required type="email" className="w-full border rounded p-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input required type="password" className="w-full border rounded p-2" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="temp" checked={formData.is_temporary_teacher} onChange={e => setFormData({...formData, is_temporary_teacher: e.target.checked})} />
            <label htmlFor="temp" className="text-sm text-gray-700">Is Temporary/Visiting Teacher?</label>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded mt-6 hover:bg-indigo-700">Save Teacher</button>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
