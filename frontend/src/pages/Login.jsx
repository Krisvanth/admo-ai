import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { motion } from 'framer-motion';
import ParticleNetwork from '@/components/ParticleNetwork';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { login, error } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const success = await login(email, password);

        if (success) {
            navigate('/');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
            {/* Animated Background */}
            <ParticleNetwork />

            <div className="max-w-4xl w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200 dark:shadow-slate-900/50 overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">


                {/* Left Side - Branding */}
                <div className="md:w-1/2 bg-slate-900 dark:bg-slate-950 p-12 flex flex-col justify-between relative overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 w-full h-full">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]"></div>

                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                x: [0, 50, 0],
                                y: [0, 30, 0],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute -top-20 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.5, 1],
                                x: [0, -30, 0],
                                y: [0, -50, 0],
                            }}
                            transition={{
                                duration: 25,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.3, 1],
                                x: [0, -40, 0],
                                y: [0, -20, 0],
                            }}
                            transition={{
                                duration: 22,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl"
                        />
                    </div>

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
                            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Admo AI</h1>
                        <p className="text-slate-400 text-lg">The intelligent school administration agent for the modern era.</p>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-white">Secure Access</p>
                                <p className="text-sm">Role-based permissions</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-white">Smart Agents</p>
                                <p className="text-sm">Automated workflows</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="md:w-1/2 p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
                        <p className="text-slate-500 dark:text-slate-400">Please sign in to your account.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@school.edu"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 dark:bg-slate-800" />
                                <span className="text-slate-600 dark:text-slate-400">Remember me</span>
                            </label>
                            <a href="#" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-700 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20 dark:shadow-primary-900/20 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Signing In...' : 'Sign In'}
                            {!isSubmitting && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Don't have an account? <a href="#" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Contact Admin</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
