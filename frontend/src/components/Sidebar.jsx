import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import {
    LayoutDashboard,
    UserCheck,
    CreditCard,
    MessageSquare,
    CalendarClock,
    Settings,
    LogOut,
    GraduationCap,
    PenTool,
    Bot,
    Users,
    Moon,
    Sun
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const allNavItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['principal', 'teacher'] },
        { icon: UserCheck, label: 'Attendance Agent', path: '/attendance', roles: ['principal', 'teacher'] },
        { icon: CreditCard, label: 'Fee Reminders', path: '/fees', roles: ['principal', 'teacher'] },
        { icon: MessageSquare, label: 'Communication', path: '/communication', roles: ['principal'] },
        { icon: CalendarClock, label: 'Timetable & Leave', path: '/timetable', roles: ['principal', 'teacher'] },
        { icon: GraduationCap, label: 'Exams & Marks', path: '/exams', roles: ['principal', 'teacher'] },
        { icon: PenTool, label: 'Teacher Assistant', path: '/teacher-assistant', roles: ['principal', 'teacher'] },
        { icon: Bot, label: 'Parent Query Bot', path: '/parent-bot', roles: ['principal'] },
        { icon: Users, label: 'Student Database', path: '/students', roles: ['principal', 'teacher'] },
        { icon: Settings, label: 'Settings', path: '/settings', roles: ['principal', 'teacher'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(user?.role || 'principal'));

    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-10 transition-all duration-300">
            <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary-500/20">
                    <img src="/logo.png" alt="Admo AI Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h1 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Admo AI</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">School Admin Agent</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</div>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={20}
                                    className={cn(
                                        "transition-colors",
                                        isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                                    )}
                                />
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>

                <div className="px-2 pt-2">
                    <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Signed in as</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'User'}</div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
