import React from 'react';
import StatCard from '@/components/StatCard';
import { Users, IndianRupee, Send, MessageCircle, CheckCircle2, Clock, AlertCircle, BookOpen, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const isPrincipal = user?.role === 'principal';

    if (!isPrincipal) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome, {user?.name || 'Teacher'} 👋</h1>
                    <p className="text-slate-500 dark:text-slate-400">Here's your schedule and tasks for today.</p>
                </div>

                {/* Teacher Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="My Class Attendance"
                        value="96%"
                        trend="2 Absent"
                        icon={Users}
                        color="primary"
                    />
                    <StatCard
                        title="Pending Marks Entry"
                        value="2"
                        trend="Due Today"
                        trendUp={false}
                        icon={BookOpen}
                        color="orange"
                    />
                    <StatCard
                        title="Upcoming Classes"
                        value="4"
                        trend="Next: Class 9-B"
                        icon={Calendar}
                        color="green"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Today's Schedule */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Today's Schedule</h2>
                        <div className="space-y-4">
                            {[
                                { period: "1", time: "09:00 - 09:45", class: "Class 10-A", subject: "Mathematics", status: "Completed" },
                                { period: "2", time: "09:45 - 10:30", class: "Class 9-B", subject: "Mathematics", status: "Ongoing" },
                                { period: "4", time: "11:15 - 12:00", class: "Class 8-C", subject: "Math Lab", status: "Upcoming" },
                                { period: "6", time: "01:30 - 02:15", class: "Class 10-B", subject: "Mathematics", status: "Upcoming" },
                            ].map((cls, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-center min-w-[3.5rem]">
                                            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Period</span>
                                            <span className="block text-lg font-bold text-slate-900 dark:text-white">{cls.period}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{cls.class} • {cls.subject}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{cls.time}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${cls.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                        cls.status === 'Ongoing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                            'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}>
                                        {cls.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Quick Actions</h2>
                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group">
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-primary-600 dark:text-primary-400 shadow-sm group-hover:scale-110 transition-transform">
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Mark Attendance</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Class 9-B (Current)</p>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group">
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-orange-600 dark:text-orange-400 shadow-sm group-hover:scale-110 transition-transform">
                                        <BookOpen size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Enter Marks</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Unit Test 2</p>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group">
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-red-600 dark:text-red-400 shadow-sm group-hover:scale-110 transition-transform">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Apply for Leave</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Sick/Casual</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Good Morning, Admin 👋</h1>
                <p className="text-slate-500 dark:text-slate-400">Here's what's happening at your school today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Today's Attendance"
                    value="94%"
                    trend="+2.5%"
                    icon={Users}
                    color="primary"
                />
                <StatCard
                    title="Fee Reminders Sent"
                    value="128"
                    trend="Pending: 45"
                    trendUp={false}
                    icon={IndianRupee}
                    color="orange"
                />
                <StatCard
                    title="Circulars Sent"
                    value="3"
                    trend="All Delivered"
                    icon={Send}
                    color="green"
                />
                <StatCard
                    title="Parent Queries"
                    value="12"
                    trend="5 Unread"
                    trendUp={false}
                    icon={MessageCircle}
                    color="secondary"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Automation Tasks */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today's Automation Tasks</h2>
                        <button className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">View All</button>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: "Morning Attendance Report", time: "09:30 AM", status: "Completed", type: "attendance" },
                            { title: "Fee Due Reminders (Class X)", time: "10:00 AM", status: "Processing", type: "fee" },
                            { title: "Substitute Teacher Allocation", time: "08:45 AM", status: "Completed", type: "timetable" },
                            { title: "Sports Day Circular Draft", time: "02:00 PM", status: "Scheduled", type: "communication" },
                            { title: "Exam Timetable Generation", time: "04:00 PM", status: "Scheduled", type: "exam" },
                        ].map((task, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${task.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                        task.status === 'Processing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                            'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                        }`}>
                                        {task.status === 'Completed' ? <CheckCircle2 size={18} /> :
                                            task.status === 'Processing' ? <Clock size={18} className="animate-spin-slow" /> :
                                                <Clock size={18} />}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{task.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{task.time} • {task.type}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${task.status === 'Completed' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                                    task.status === 'Processing' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                                        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}>
                                    {task.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions / Alerts */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Action Required</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                <div className="flex gap-3">
                                    <AlertCircle className="text-red-600 dark:text-red-400 shrink-0" size={20} />
                                    <div>
                                        <h3 className="text-sm font-bold text-red-900 dark:text-red-200">5 Teachers Absent</h3>
                                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">Substitutes needed for Class 8A, 9B.</p>
                                        <button className="mt-3 text-xs bg-white dark:bg-red-900/40 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/60 transition-colors">
                                            Assign Substitutes
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                <div className="flex gap-3">
                                    <AlertCircle className="text-orange-600 dark:text-orange-400 shrink-0" size={20} />
                                    <div>
                                        <h3 className="text-sm font-bold text-orange-900 dark:text-orange-200">Low SMS Balance</h3>
                                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Only 120 credits remaining.</p>
                                        <button className="mt-3 text-xs bg-white dark:bg-orange-900/40 text-orange-700 dark:text-orange-200 border border-orange-200 dark:border-orange-800 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-50 dark:hover:bg-orange-900/60 transition-colors">
                                            Recharge Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Exams */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Upcoming Exams</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-center min-w-[3rem]">
                                    <span className="block text-xs font-bold uppercase">Oct</span>
                                    <span className="block text-lg font-bold">15</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Half Yearly Exams</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Class 9 & 10 • 5 Days left</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-center min-w-[3rem]">
                                    <span className="block text-xs font-bold uppercase">Oct</span>
                                    <span className="block text-lg font-bold">22</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Unit Test 2</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Class 6 - 8 • 12 Days left</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
