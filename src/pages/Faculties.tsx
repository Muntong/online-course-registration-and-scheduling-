import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'motion/react';
import { School, Plus, Trash2 } from 'lucide-react';

export const Faculties = () => {
  const { token } = useAuthStore();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', faculty: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ name: '', code: '', faculty: '' });
        setShowAdd(false);
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error adding department:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading faculties...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-paypal-dark">Faculties & Departments</h1>
          <p className="text-gray-500 mt-2">Manage academic faculties and departments.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-paypal-light hover:bg-paypal-dark text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Department</span>
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4">Add New Department</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Department Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                required
              />
              <input
                type="text"
                placeholder="Department Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                required
              />
              <input
                type="text"
                placeholder="Faculty Name"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-paypal-light text-white rounded-xl hover:bg-paypal-dark transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-paypal-light/10 rounded-xl text-paypal-light">
                <School className="w-6 h-6" />
              </div>
              <button onClick={() => handleDelete(dept._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-1">{dept.name}</h3>
            <p className="text-gray-500 text-sm mb-4">Code: {dept.code}</p>
            
            <div className="text-sm text-gray-600 border-t border-gray-100 pt-4">
              <span className="font-medium">Faculty:</span> {dept.faculty}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
