import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contact_info: '',
    class_id: ''
  });
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await api.get('/classes');
        setClasses(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, class_id: data[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch classes', err);
      }
    };
    fetchClasses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const { data } = await api.post('/auth/register', formData);
      setSuccess(data.message);
      setFormData({ name: '', email: '', password: '', contact_info: '', class_id: '' });
      // Redirect after a few seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Student Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join the school ecosystem
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">{success}</div>}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1">
                <input required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input type="email" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input type="password" required minLength="6" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grade & Section</label>
              <div className="mt-1">
                <select 
                  required 
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.class_id}
                  onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                >
                  <option value="" disabled>Select your class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>Gr {c.grade} ({c.section})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Information</label>
              <div className="mt-1">
                <input required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Parent's phone number or address" value={formData.contact_info} onChange={e => setFormData({ ...formData, contact_info: e.target.value })} />
              </div>
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Register
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
