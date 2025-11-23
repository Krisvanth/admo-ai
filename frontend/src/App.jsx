import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Login from '@/pages/Login';
import DashboardLayout from '@/layouts/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Attendance from '@/pages/Attendance';
import FeeReminders from '@/pages/FeeReminders';
import Communication from '@/pages/Communication';
import Timetable from '@/pages/Timetable';
import ExamAssessment from '@/pages/ExamAssessment';
import TeacherAssistant from '@/pages/TeacherAssistant';
import ParentQueryBot from '@/pages/ParentQueryBot';
import Settings from '@/pages/Settings';

import StudentDatabase from '@/pages/StudentDatabase';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="fees" element={<FeeReminders />} />
                <Route path="communication" element={<Communication />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="exams" element={<ExamAssessment />} />
                <Route path="teacher-assistant" element={<TeacherAssistant />} />
                <Route path="parent-bot" element={<ParentQueryBot />} />
                <Route path="students" element={<StudentDatabase />} />
                <Route path="settings" element={<Settings />} />
            </Route>
        </Routes>
    );
}
export default App;
