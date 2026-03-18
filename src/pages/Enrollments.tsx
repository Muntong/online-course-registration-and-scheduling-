import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'motion/react';
import { FileEdit, Users, BookOpen, Plus, Trash2 } from 'lucide-react';

export const Enrollments = () => {
  const { token } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, usersRes] = await Promise.all([
        fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (coursesRes.ok && usersRes.ok) {
        const coursesData = await coursesRes.json();
        const usersData = await usersRes.json();
        setCourses(coursesData);
        setStudents(usersData.filter((u: any) => u.role === 'student'));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!selectedStudent) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/admin-enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: selectedStudent })
      });
      if (res.ok) {
        fetchData();
        setSelectedStudent('');
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
    }
  };

  const handleDrop = async (courseId: string, studentId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/admin-drop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentId })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error dropping student:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading enrollments...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-paypal-dark">Enrollment Management</h1>
        <p className="text-gray-500 mt-2">View and manage course enrollments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Select Course</h2>
          {courses.map((course) => (
            <div 
              key={course._id} 
              onClick={() => setSelectedCourse(course._id)}
              className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedCourse === course._id ? 'border-paypal-light bg-paypal-light/5' : 'border-gray-200 bg-white hover:border-paypal-light/50'}`}
            >
              <h3 className="font-bold text-gray-900">{course.title}</h3>
              <p className="text-sm text-gray-500">{course.code}</p>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <Users className="w-3 h-3 mr-1" />
                {course.studentsEnrolled?.length || 0} / {course.maxCapacity} Enrolled
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedCourse ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Students</h2>
              
              <div className="flex space-x-4 mb-8">
                <select 
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                >
                  <option value="">Select a student to enroll...</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>{student.name} ({student.email})</option>
                  ))}
                </select>
                <button 
                  onClick={() => handleEnroll(selectedCourse)}
                  disabled={!selectedStudent}
                  className="bg-paypal-light hover:bg-paypal-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Enroll</span>
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 mb-4">Currently Enrolled</h3>
                {courses.find(c => c._id === selectedCourse)?.studentsEnrolled?.length === 0 && (
                  <p className="text-gray-500 text-sm italic">No students enrolled yet.</p>
                )}
                {courses.find(c => c._id === selectedCourse)?.studentsEnrolled?.map((studentId: string) => {
                  const student = students.find(s => s._id === studentId);
                  if (!student) return null;
                  return (
                    <div key={studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <button 
                        onClick={() => handleDrop(selectedCourse, studentId)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Remove Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full">
              <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Course Selected</h3>
              <p className="text-gray-500 mt-1">Select a course from the list to manage its enrollments.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
