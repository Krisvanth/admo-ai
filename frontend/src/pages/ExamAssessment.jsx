import React, { useState } from 'react';
import { Calendar, FileText, Bell, CheckCircle2, Clock, AlertCircle, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ExamAssessment = () => {
  const [activeTab, setActiveTab] = useState('timetable');
  const { user } = useAuth();
  const isPrincipal = user?.role === 'principal';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Exam & Assessment Agent</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage exams, marks, and communication efficiently.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
        {['timetable', 'marks', ...(isPrincipal ? ['communication'] : [])].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium capitalize transition-colors relative ${activeTab === tab
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-400 rounded-t-full"></span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'timetable' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="font-bold text-slate-900 dark:text-white mb-4">
                {isPrincipal ? "Review Timetables" : "Create Draft Timetable"}
              </h2>

              {isPrincipal ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary-300 dark:hover:border-primary-500 transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Half Yearly 2024</h3>
                      <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded">Pending Review</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Class 10 • Submitted by Mrs. Sarah</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 opacity-60">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Unit Test 2</h3>
                      <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">Published</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Class 9 • Published yesterday</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Name</label>
                    <input type="text" placeholder="e.g., Half Yearly 2024" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Classes</label>
                    <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 outline-none text-slate-900 dark:text-white">
                      <option className="dark:bg-slate-900">Class 10</option>
                      <option className="dark:bg-slate-900">Class 9</option>
                      <option className="dark:bg-slate-900">Class 8</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 outline-none text-slate-900 dark:text-white" />
                  </div>
                  <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-primary-500/30">
                    Generate Draft
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-900 dark:text-white">
                {isPrincipal ? "Reviewing: Half Yearly 2024 (Class 10)" : "Draft Preview"}
              </h2>
              {!isPrincipal && <button className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">Edit</button>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { date: "10 Dec", day: "Monday", subject: "Mathematics", time: "09:00 AM - 12:00 PM" },
                    { date: "12 Dec", day: "Wednesday", subject: "Science", time: "09:00 AM - 12:00 PM" },
                    { date: "14 Dec", day: "Friday", subject: "English", time: "09:00 AM - 12:00 PM" },
                    { date: "17 Dec", day: "Monday", subject: "Social Science", time: "09:00 AM - 12:00 PM" },
                  ].map((exam, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{exam.date}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{exam.day}</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white">{exam.subject}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{exam.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              {isPrincipal ? (
                <>
                  <button className="px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10">Reject & Request Changes</button>
                  <button className="px-4 py-2 bg-slate-900 dark:bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-primary-700 shadow-lg shadow-slate-900/20 dark:shadow-primary-900/20">Approve & Publish</button>
                </>
              ) : (
                <button className="px-4 py-2 bg-slate-900 dark:bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-primary-700 shadow-lg shadow-slate-900/20 dark:shadow-primary-900/20">Submit for Approval</button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-900 dark:text-white">Mark Entry Status</h2>
              <div className="flex gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">Completed: 3/5</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">Pending: 2</span>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { subject: "Mathematics", teacher: "Mr. Rao", status: "Submitted", date: "Yesterday" },
                { subject: "Science", teacher: "Ms. Sarah", status: "Pending", date: "Due Today" },
                { subject: "English", teacher: "Mrs. Devi", status: "Submitted", date: "2 days ago" },
                { subject: "Social Science", teacher: "Mr. Kumar", status: "Pending", date: "Overdue" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${item.status === 'Submitted' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{item.subject}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.teacher}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.status === 'Submitted' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                      {item.status}
                    </span>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="font-bold text-slate-900 dark:text-white mb-4">Actions</h2>
              <button className="w-full mb-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                <Bell size={18} />
                Remind Pending Teachers
              </button>
              <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-primary-500/30">
                Generate Report Cards
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'communication' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Exam Communication Logs</h2>
          <div className="space-y-4">
            <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl">
              <div className="flex justify-between mb-2">
                <h3 className="font-medium text-slate-900 dark:text-white">Exam Schedule Announcement</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Sent: 2 days ago</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Dear Parents, The Half Yearly exams for Class 10 will commence from 10th Dec...</p>
              <div className="flex gap-2">
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">Via WhatsApp</span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">Via Email</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamAssessment;
