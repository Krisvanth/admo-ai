import React from 'react';
import { cn } from '@/utils/cn';

const StatCard = ({ title, value, trend, icon: Icon, color = "primary", trendUp = true }) => {
    const colorStyles = {
        primary: "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400",
        secondary: "bg-secondary-50 dark:bg-slate-800 text-secondary-600 dark:text-slate-400",
        green: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
        orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-xl", colorStyles[color])}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        trendUp ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
            </div>
        </div>
    );
};

export default StatCard;
