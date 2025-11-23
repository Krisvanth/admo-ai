import React, { useState } from 'react';
import { Send, Wand2, History, Globe } from 'lucide-react';

const Communication = () => {
    const [language, setLanguage] = useState('English');
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');

    const handleGenerate = () => {
        if (!topic) return;
        setIsGenerating(true);
        setTimeout(() => {
            setGeneratedContent(`Dear Parents,\n\nThis is to inform you about the ${topic} scheduled for next week. We request all students to be present.\n\nRegards,\nPrincipal`);
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parent Communication Agent</h1>
                <p className="text-slate-500 dark:text-slate-400">Draft and send multilingual updates to parents instantly.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center">1</span>
                            Draft Message
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message Topic / Context</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 outline-none min-h-[100px] resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    placeholder="E.g., School will be closed tomorrow due to heavy rain..."
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Language</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['English', 'Tamil', 'Kannada', 'Telugu', 'Malayalam', 'Hindi'].map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => setLanguage(lang)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${language === lang
                                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-500 text-primary-700 dark:text-primary-400'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!topic || isGenerating}
                                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Generating Draft...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 size={18} />
                                        Generate with AI
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <History size={20} className="text-slate-400 dark:text-slate-500" />
                            Recent Broadcasts
                        </h2>
                        <div className="space-y-3">
                            {[
                                { topic: "Annual Sports Day", date: "Yesterday", status: "Sent" },
                                { topic: "Exam Schedule Change", date: "2 days ago", status: "Sent" },
                            ].map((msg, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{msg.topic}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{msg.date}</p>
                                    </div>
                                    <span className="text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">{msg.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 rounded-lg flex items-center justify-center">2</span>
                            Preview & Send
                        </h2>

                        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 relative overflow-hidden">
                            {!generatedContent ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                    <Globe size={48} className="mb-2 opacity-20" />
                                    <p className="text-sm">Generated message will appear here</p>
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{generatedContent}</p>
                                    {language !== 'English' && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">English Translation</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 italic">Dear Parents, This is to inform you about the {topic}...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                Edit Manually
                            </button>
                            <button className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary-500/30">
                                <Send size={18} />
                                Send Broadcast
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Communication;
