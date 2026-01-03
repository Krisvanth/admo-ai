import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '@/components/StatCard';
import { 
    Users, IndianRupee, Send, MessageCircle, CheckCircle2, Clock, AlertCircle, 
    BookOpen, Calendar, GraduationCap, UserCheck, ClipboardList, CalendarDays,
    ChevronRight, Check, X, Loader2, School, TrendingUp, Building2, Cake, Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dashboardService, leaveService } from '@/services/api';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isPrincipal = user?.role === 'PRINCIPAL';
    
    const [stats, setStats] = useState(null);
    const [timetableConfig, setTimetableConfig] = useState(null);
    const [birthdays, setBirthdays] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingLeave, setProcessingLeave] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, configData, birthdaysData] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getTimetableConfig(),
                dashboardService.getBirthdays()
            ]);
            setStats(statsData);
            setTimetableConfig(configData);
            setBirthdays(birthdaysData);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveAction = async (leaveId, action) => {
        try {
            setProcessingLeave(leaveId);
            await leaveService.updateLeaveStatus(leaveId, action);
            // Refresh stats after action
            await fetchDashboardData();
        } catch (err) {
            console.error('Failed to update leave:', err);
        } finally {
            setProcessingLeave(null);
        }
    };

    const getTimeSlotInfo = (slotNumber) => {
        if (!timetableConfig?.time_slots) return { time: '', name: '' };
        const slot = timetableConfig.time_slots.find(s => s.slot_number === slotNumber);
        return slot ? { time: `${slot.start_time} - ${slot.end_time}`, name: slot.name } : { time: '', name: '' };
    };

    const getCurrentPeriodStatus = (slotNumber) => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        if (!timetableConfig?.time_slots) return 'Upcoming';
        
        const slot = timetableConfig.time_slots.find(s => s.slot_number === slotNumber);
        if (!slot) return 'Upcoming';

        const [startH, startM] = slot.start_time.split(':').map(Number);
        const [endH, endM] = slot.end_time.split(':').map(Number);
        const startTime = startH * 60 + startM;
        const endTime = endH * 60 + endM;

        if (currentTime < startTime) return 'Upcoming';
        if (currentTime >= startTime && currentTime <= endTime) return 'Ongoing';
        return 'Completed';
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
                    <button 
                        onClick={fetchDashboardData}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // ===================== TEACHER DASHBOARD =====================
    if (!isPrincipal) {
        return (
            <div className="space-y-8">
                {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {getGreeting()}, {user?.name || 'Teacher'} 👋
                </h1>
                <p className="text-slate-500 dark:text-slate-400">Here's your schedule and overview for today.</p>
            </div>                {/* Teacher Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Classes Today"
                        value={stats?.classes_today || 0}
                        trend={stats?.today_schedule?.length > 0 
                            ? `Next: ${stats.today_schedule.find(s => getCurrentPeriodStatus(s.slot_number) === 'Upcoming')?.class_name || 'Done for today'}`
                            : 'No classes scheduled'}
                        icon={Calendar}
                        color="primary"
                    />
                    <StatCard
                        title="My Students"
                        value={stats?.my_students || 0}
                        trend={`${stats?.my_classes?.length || 0} classes assigned`}
                        icon={Users}
                        color="green"
                    />
                    <StatCard
                        title="Leave Status"
                        value={stats?.my_leave_status?.pending || 0}
                        trend={`${stats?.my_leave_status?.approved || 0} approved this year`}
                        trendUp={stats?.my_leave_status?.pending === 0}
                        icon={ClipboardList}
                        color={stats?.my_leave_status?.pending > 0 ? 'orange' : 'green'}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Today's Schedule */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today's Schedule</h2>
                            <Link 
                                to="/timetable"
                                className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1"
                            >
                                Full Timetable <ChevronRight size={16} />
                            </Link>
                        </div>
                        
                        {stats?.today_schedule?.length > 0 ? (
                            <div className="space-y-4">
                                {stats.today_schedule.map((cls, i) => {
                                    const slotInfo = getTimeSlotInfo(cls.slot_number);
                                    const status = getCurrentPeriodStatus(cls.slot_number);
                                    return (
                                        <div 
                                            key={i} 
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                                                status === 'Ongoing' 
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' 
                                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-lg border text-center min-w-[3.5rem] ${
                                                    status === 'Ongoing'
                                                        ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-200 dark:border-primary-700'
                                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                                }`}>
                                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Period</span>
                                                    <span className="block text-lg font-bold text-slate-900 dark:text-white">{cls.slot_number}</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white">{cls.class_name} • {cls.subject_name}</h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{slotInfo.time}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                                                status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                status === 'Ongoing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}>
                                                {status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <h3 className="font-medium text-slate-900 dark:text-white mb-1">No Classes Today</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">You don't have any scheduled classes for today.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* My Classes */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Classes</h2>
                                <Link 
                                    to="/students"
                                    className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
                                >
                                    View All
                                </Link>
                            </div>
                            
                            {stats?.my_classes?.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.my_classes.map((cls, i) => (
                                        <Link 
                                            key={i}
                                            to={`/students?class=${cls.class_id}`}
                                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                                                    <GraduationCap size={18} className="text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-white">{cls.class_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">{cls.student_count} students</span>
                                                <ChevronRight size={16} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No classes assigned yet.</p>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Quick Actions</h2>
                            <div className="space-y-3">
                                <button 
                                    onClick={() => navigate('/attendance')}
                                    className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group"
                                >
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-primary-600 dark:text-primary-400 shadow-sm group-hover:scale-110 transition-transform">
                                        <UserCheck size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Mark Attendance</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Daily attendance</p>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => navigate('/timetable')}
                                    className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group"
                                >
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-green-600 dark:text-green-400 shadow-sm group-hover:scale-110 transition-transform">
                                        <CalendarDays size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">My Timetable</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Weekly schedule</p>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => navigate('/timetable?tab=leave')}
                                    className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group"
                                >
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-orange-600 dark:text-orange-400 shadow-sm group-hover:scale-110 transition-transform">
                                        <ClipboardList size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Apply for Leave</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Request time off</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Birthdays */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Cake size={20} className="text-pink-600 dark:text-pink-400" />
                                    Birthdays
                                </h2>
                                {birthdays && (birthdays.today_count + birthdays.week_count) > 0 && (
                                    <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-1 rounded-full font-medium">
                                        {birthdays.today_count + birthdays.week_count}
                                    </span>
                                )}
                            </div>
                            
                            {birthdays && (birthdays.today_count > 0 || birthdays.week_count > 0) ? (
                                <div className="space-y-3">
                                    {/* Today's birthdays */}
                                    {birthdays.today?.map((person, i) => (
                                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                                            person.type === 'teacher' 
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                                : 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800'
                                        }`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                person.type === 'teacher'
                                                    ? 'bg-blue-100 dark:bg-blue-900/40'
                                                    : 'bg-pink-100 dark:bg-pink-900/40'
                                            }`}>
                                                <Cake size={18} className={person.type === 'teacher' ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-slate-900 dark:text-white">{person.name}</h3>
                                                    {person.type === 'teacher' && (
                                                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                                                            Teacher
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {person.class} • {person.age} years old • Today! 🎉
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Upcoming this week */}
                                    {birthdays.this_week?.slice(0, 3).map((person, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                person.type === 'teacher'
                                                    ? 'bg-blue-100 dark:bg-blue-900/30'
                                                    : 'bg-slate-100 dark:bg-slate-700'
                                            }`}>
                                                {person.type === 'teacher' ? (
                                                    <Users size={16} className="text-blue-600 dark:text-blue-400" />
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                                        {person.name.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-slate-900 dark:text-white">{person.name}</h3>
                                                    {person.type === 'teacher' && (
                                                        <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-medium">
                                                            Teacher
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {person.class} • {person.age} years old • In {person.days_until} days
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400">No birthdays this week</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===================== PRINCIPAL DASHBOARD =====================
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {getGreeting()}, {user?.name || 'Principal'} 👋
                </h1>
                <p className="text-slate-500 dark:text-slate-400">Here's what's happening at your school today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Students"
                    value={stats?.total_students || 0}
                    trend={`${stats?.total_classes || 0} classes`}
                    icon={GraduationCap}
                    color="primary"
                />
                <StatCard
                    title="Today's Attendance"
                    value={`${stats?.attendance_today?.present_percentage || 0}%`}
                    trend={`${stats?.attendance_today?.total_absent || 0} absent`}
                    trendUp={stats?.attendance_today?.present_percentage >= 90}
                    icon={UserCheck}
                    color="green"
                />
                <StatCard
                    title="Pending Leaves"
                    value={stats?.pending_leaves || 0}
                    trend="Requires action"
                    trendUp={stats?.pending_leaves === 0}
                    icon={ClipboardList}
                    color={stats?.pending_leaves > 0 ? 'orange' : 'green'}
                />
                <StatCard
                    title="Fee Collection"
                    value={`${stats?.fee_stats?.collection_rate || 0}%`}
                    trend={`₹${((stats?.fee_stats?.pending || 0) / 1000).toFixed(0)}k pending`}
                    trendUp={stats?.fee_stats?.collection_rate >= 80}
                    icon={IndianRupee}
                    color="secondary"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Class Distribution */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Class-wise Students</h2>
                            <Link 
                                to="/students"
                                className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1"
                            >
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>
                        
                        {stats?.class_distribution?.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {stats.class_distribution.map((cls, i) => (
                                    <Link 
                                        key={i}
                                        to={`/students?class=${cls.class_id}`}
                                        className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 transition-all group"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                                <School size={16} className="text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white">{cls.class_name}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{cls.student_count}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">students</p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">No classes configured yet.</p>
                                <Link to="/school" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
                                    Add Classes
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Leave Requests */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pending Leave Requests</h2>
                            <Link 
                                to="/timetable?tab=leave"
                                className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1"
                            >
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>
                        
                        {stats?.recent_leave_requests?.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recent_leave_requests.map((leave, i) => (
                                    <div 
                                        key={i} 
                                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                                    {leave.teacher_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-slate-900 dark:text-white">{leave.teacher_name}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {leave.start_date === leave.end_date 
                                                        ? leave.start_date 
                                                        : `${leave.start_date} to ${leave.end_date}`}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px]">
                                                    {leave.reason}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleLeaveAction(leave.id, 'Approved')}
                                                disabled={processingLeave === leave.id}
                                                className="p-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg transition-colors disabled:opacity-50"
                                                title="Approve"
                                            >
                                                {processingLeave === leave.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Check size={16} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                                                disabled={processingLeave === leave.id}
                                                className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                                title="Reject"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <h3 className="font-medium text-slate-900 dark:text-white mb-1">All Caught Up!</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">No pending leave requests.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Quick Actions</h2>
                        <div className="space-y-3">
                            <button 
                                onClick={() => navigate('/students')}
                                className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group"
                            >
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-primary-600 dark:text-primary-400 shadow-sm group-hover:scale-110 transition-transform">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Manage Students</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Add, edit, view students</p>
                                </div>
                            </button>
                            <button 
                                onClick={() => navigate('/school')}
                                className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group"
                            >
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-green-600 dark:text-green-400 shadow-sm group-hover:scale-110 transition-transform">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">School Settings</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Classes & Subjects</p>
                                </div>
                            </button>
                            <button 
                                onClick={() => navigate('/timetable')}
                                className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group"
                            >
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-orange-600 dark:text-orange-400 shadow-sm group-hover:scale-110 transition-transform">
                                    <CalendarDays size={18} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Timetable</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage schedules</p>
                                </div>
                            </button>
                            <button 
                                onClick={() => navigate('/fees')}
                                className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group"
                            >
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-purple-600 dark:text-purple-400 shadow-sm group-hover:scale-110 transition-transform">
                                    <IndianRupee size={18} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Fee Management</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Track payments</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* School Overview */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">School Overview</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <GraduationCap size={18} className="text-primary-600 dark:text-primary-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-300">Total Students</span>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{stats?.total_students || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Users size={18} className="text-green-600 dark:text-green-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-300">Total Teachers</span>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{stats?.total_teachers || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <School size={18} className="text-orange-600 dark:text-orange-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-300">Total Classes</span>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{stats?.total_classes || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Birthdays */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Cake size={20} className="text-pink-600 dark:text-pink-400" />
                                Birthdays
                            </h2>
                            {birthdays && (birthdays.today_count + birthdays.week_count) > 0 && (
                                <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-1 rounded-full font-medium">
                                    {birthdays.today_count + birthdays.week_count}
                                </span>
                            )}
                        </div>
                        
                        {birthdays && (birthdays.today_count > 0 || birthdays.week_count > 0) ? (
                            <div className="space-y-3">
                                {/* Today's birthdays */}
                                {birthdays.today?.map((person, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                                        person.type === 'teacher' 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                            : 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800'
                                    }`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            person.type === 'teacher'
                                                ? 'bg-blue-100 dark:bg-blue-900/40'
                                                : 'bg-pink-100 dark:bg-pink-900/40'
                                        }`}>
                                            <Cake size={18} className={person.type === 'teacher' ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-slate-900 dark:text-white">{person.name}</h3>
                                                {person.type === 'teacher' && (
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                                                        Teacher
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {person.class} • {person.age} years old • Today! 🎉
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Upcoming this week */}
                                {birthdays.this_week?.slice(0, 3).map((person, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            person.type === 'teacher'
                                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                                : 'bg-slate-100 dark:bg-slate-700'
                                        }`}>
                                            {person.type === 'teacher' ? (
                                                <Users size={16} className="text-blue-600 dark:text-blue-400" />
                                            ) : (
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                                    {person.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-slate-900 dark:text-white">{person.name}</h3>
                                                {person.type === 'teacher' && (
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                                                        Teacher
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {person.class} • In {person.days_until} day{person.days_until !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Cake className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">No birthdays this week</p>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Events */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Upcoming Events</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-center min-w-[3rem]">
                                    <span className="block text-xs font-bold uppercase">Jan</span>
                                    <span className="block text-lg font-bold">15</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Unit Test 3</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Class 6 - 10 • 13 Days</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-center min-w-[3rem]">
                                    <span className="block text-xs font-bold uppercase">Jan</span>
                                    <span className="block text-lg font-bold">26</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Republic Day</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Holiday • 24 Days</p>
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
