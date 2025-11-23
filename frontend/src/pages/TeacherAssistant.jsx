import React, { useState } from 'react';
import { BookOpen, FileText, Calendar, PenTool, Download, Sparkles } from 'lucide-react';

const TeacherAssistant = () => {
    const [activeTool, setActiveTool] = useState('homework');

    const tools = [
        { id: 'homework', label: 'Homework Generator', icon: BookOpen },
        { id: 'lesson', label: 'Lesson Plan', icon: PenTool },
        { id: 'worksheet', label: 'Worksheet Creator', icon: FileText },
        { id: 'event', label: 'Event Announcement', icon: Calendar },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Teacher Assistant Agent</h1>
                <p className="text-slate-500 dark:text-slate-400">AI-powered tools to help teachers save time.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Tools Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTool === tool.id
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-900/30'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                                }`}
                        >
                            <tool.icon size={18} className={activeTool === tool.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'} />
                            {tool.label}
                        </button>
                    ))}
                </div>

                {/* Tool Content */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[500px]">
                        {activeTool === 'homework' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                                        <BookOpen size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Homework Generator</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                                        <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white">
                                            <option className="dark:bg-slate-900">Mathematics</option>
                                            <option className="dark:bg-slate-900">Science</option>
                                            <option className="dark:bg-slate-900">English</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label>
                                        <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white">
                                            <option className="dark:bg-slate-900">Class 10</option>
                                            <option className="dark:bg-slate-900">Class 9</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic / Concept</label>
                                    <input type="text" placeholder="e.g., Quadratic Equations" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty Level</label>
                                    <div className="flex gap-4">
                                        {['Easy', 'Medium', 'Hard'].map(level => (
                                            <label key={level} className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="difficulty" className="text-primary-600 focus:ring-primary-500 dark:bg-slate-800 dark:border-slate-600" />
                                                <span className="text-sm text-slate-600 dark:text-slate-400">{level}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/20">
                                    <Sparkles size={18} />
                                    Generate Homework Draft
                                </button>

                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">Generated Output</h3>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 space-y-2">
                                        <p className="font-medium">Topic: Quadratic Equations (Medium)</p>
                                        <ol className="list-decimal list-inside space-y-1 ml-2">
                                            <li>Solve for x: x² - 5x + 6 = 0</li>
                                            <li>Find the roots of the equation: 2x² - 7x + 3 = 0</li>
                                            <li>The sum of a number and its reciprocal is 10/3. Find the number.</li>
                                        </ol>
                                    </div>
                                    <div className="flex justify-end mt-3 gap-2">
                                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <Download size={14} /> Download PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTool === 'lesson' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                        <PenTool size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lesson Plan Generator</h2>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Enter the topic details to generate a structured lesson plan including objectives, activities, and assessment.</p>
                                {/* Placeholder inputs similar to homework */}
                                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium">Generate Plan</button>
                            </div>
                        )}

                        {/* Other tools placeholders */}
                        {(activeTool === 'worksheet' || activeTool === 'event') && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                                <Sparkles size={48} className="mb-4 opacity-20" />
                                <p>Select a tool to start generating content</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherAssistant;
