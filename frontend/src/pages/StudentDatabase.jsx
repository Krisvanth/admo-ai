import React, { useState } from 'react';
import { Search, Upload, Plus, Filter, Download, MoreHorizontal, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const StudentDatabase = () => {
    const { user } = useAuth();
    const isPrincipal = user?.role === 'principal';

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState('All');
    const [isUploading, setIsUploading] = useState(false);

    // Mock Data
    const [students, setStudents] = useState([
        { id: 1, name: 'Aarav Patel', class: 'Class 10-A', rollNo: '101', parent: 'Suresh Patel', contact: '+91 98765 43210', email: 'aarav.p@example.com' },
        { id: 2, name: 'Diya Sharma', class: 'Class 10-A', rollNo: '102', parent: 'Rahul Sharma', contact: '+91 98765 43211', email: 'diya.s@example.com' },
        { id: 3, name: 'Ishaan Gupta', class: 'Class 9-B', rollNo: '201', parent: 'Amit Gupta', contact: '+91 98765 43212', email: 'ishaan.g@example.com' },
        { id: 4, name: 'Ananya Singh', class: 'Class 9-B', rollNo: '202', parent: 'Vikram Singh', contact: '+91 98765 43213', email: 'ananya.s@example.com' },
        { id: 5, name: 'Vihaan Kumar', class: 'Class 8-A', rollNo: '301', parent: 'Rajesh Kumar', contact: '+91 98765 43214', email: 'vihaan.k@example.com' },
    ]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsUploading(true);
            // Simulate upload delay
            setTimeout(() => {
                setIsUploading(false);
                alert(`Successfully uploaded ${file.name}. Database updated.`);
                // In a real app, we would parse the file here
            }, 1500);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.rollNo.includes(searchQuery) ||
            student.parent.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = selectedClass === 'All' || student.class === selectedClass;
        return matchesSearch && matchesClass;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Database</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage student records, admissions, and details.</p>
                </div>
                <div className="flex gap-3">
                    <label className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center gap-2">
                        <Upload size={18} />
                        {isUploading ? 'Uploading...' : 'Upload CSV/Excel'}
                        <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                    <button className="bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-primary-900/20">
                        <Plus size={18} />
                        Add Student
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, roll no, or parent..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                            <Filter size={16} className="text-slate-500 dark:text-slate-400" />
                            <select
                                className="bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="All" className="dark:bg-slate-900">All Classes</option>
                                <option value="Class 10-A" className="dark:bg-slate-900">Class 10-A</option>
                                <option value="Class 10-B" className="dark:bg-slate-900">Class 10-B</option>
                                <option value="Class 9-A" className="dark:bg-slate-900">Class 9-A</option>
                                <option value="Class 9-B" className="dark:bg-slate-900">Class 9-B</option>
                                <option value="Class 8-A" className="dark:bg-slate-900">Class 8-A</option>
                            </select>
                        </div>
                        <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Export">
                            <Download size={20} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Class</th>
                                <th className="px-6 py-4">Roll No</th>
                                <th className="px-6 py-4">Parent Name</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
                                                    {student.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                                                {student.class}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono">{student.rollNo}</td>
                                        <td className="px-6 py-4 text-slate-900 dark:text-white">{student.parent}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{student.contact}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileSpreadsheet size={48} className="text-slate-200 dark:text-slate-700" />
                                            <p>No students found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Mock) */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <p>Showing {filteredStudents.length} of {students.length} students</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDatabase;
