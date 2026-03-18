import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { BookOpen, Lock, Mail, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      login(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paypal-bg p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-paypal-dark rounded-full flex items-center justify-center mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-paypal-dark">EduSync</h2>
          <p className="text-gray-500 mt-2">
            {isLogin ? 'Welcome back to your portal' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light focus:border-transparent transition-all outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light focus:border-transparent transition-all outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="text-sm text-gray-500 text-center bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="font-semibold text-paypal-dark">Note:</span> The first registered user automatically becomes an Admin. All subsequent users are Students. Admins can change roles in the dashboard.
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-paypal-light hover:bg-paypal-dark text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-paypal-light hover:text-paypal-dark font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
