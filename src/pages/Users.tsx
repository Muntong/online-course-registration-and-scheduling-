import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'motion/react';
import { User as UserIcon, Mail, Shield } from 'lucide-react';

export const Users = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading users...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-paypal-dark">User Management</h1>
        <p className="text-gray-500 mt-2">Manage students, lecturers, and admins.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paypal-bg border-b border-gray-100 text-paypal-dark">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-paypal-light/10 flex items-center justify-center text-paypal-light">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{u.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Shield className={`w-4 h-4 ${u.role === 'admin' ? 'text-red-500' : u.role === 'lecturer' ? 'text-blue-500' : 'text-green-500'}`} />
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5"
                      >
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
