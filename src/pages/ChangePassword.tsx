import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'motion/react';
import { Key, Lock } from 'lucide-react';

export const ChangePassword = () => {
  const { token } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match');
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="w-16 h-16 bg-paypal-light/10 rounded-full flex items-center justify-center mx-auto mb-4 text-paypal-light">
          <Key className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-paypal-dark">Change Password</h1>
        <p className="text-gray-500 mt-2">Update your account security credentials.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        {message && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm border border-green-100">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-10 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-paypal-light hover:bg-paypal-dark text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md"
          >
            Update Password
          </button>
        </form>
      </div>
    </motion.div>
  );
};
