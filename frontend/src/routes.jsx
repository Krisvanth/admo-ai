import React from 'react';
import { useRoutes } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Attendance from '@/pages/Attendance';
import FeeReminders from '@/pages/FeeReminders';
import Communication from '@/pages/Communication';
import Timetable from '@/pages/Timetable';
import ExamAssessment from '@/pages/ExamAssessment';
import TeacherAssistant from '@/pages/TeacherAssistant';
import ParentQueryBot from '@/pages/ParentQueryBot';
import Settings from '@/pages/Settings';

const AppRoutes = () => {
    const element = useRoutes([
        {
            path: '/login',
            element: <Login />,
        },
        {
            path: '/',
            element: <DashboardLayout />,
            children: [
                { index: true, element: <Dashboard /> },
                { path: 'attendance', element: <Attendance /> },
                { path: 'fees', element: <FeeReminders /> },
                { path: 'communication', element: <Communication /> },
                { path: 'timetable', element: <Timetable /> },
                { path: 'exams', element: <ExamAssessment /> },
                { path: 'teacher-assistant', element: <TeacherAssistant /> },
                { path: 'parent-bot', element: <ParentQueryBot /> },
                { path: 'settings', element: <Settings /> },
            ],
        },
    ]);

    return element;
};

export default AppRoutes;
