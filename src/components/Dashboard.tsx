"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

// Define interfaces for our data structures
interface Interview {
    id: number;
    jobRole: string;
    company: string;
    createdAt: string;
    status: string;
    overallScore: number | null;
}

interface UserStats {
    totalInterviews: number;
    totalAnswers: number;
    averageRelevance: string;
    averageClarity: string;
    averageDepth: string;
    averageScore: number;
    behavioralSkill: number;
    technicalSkill: number;
    communicationSkill: number;
    currentStreak: number;
}

const StatCard = ({
    title,
    value,
    unit,
}: {
    title: string;
    value: string | number;
    unit?: string;
}) => (
    <div className="bg-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md">
        <h3 className="text-md font-semibold text-gray-500">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 mt-2">
            {value}
            {unit && <span className="text-lg font-medium text-gray-600 ml-1">{unit}</span>}
        </p>
    </div>
);

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserData = useCallback(async (userId: number) => {
        try {
            setLoading(true);
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

            const [statsRes, interviewsRes] = await Promise.all([
                fetch(`${backendUrl}/api/user-stats/${userId}`),
                fetch(`${backendUrl}/api/interview-history/${userId}`),
            ]);

            if (!statsRes.ok || !interviewsRes.ok) {
                throw new Error("Failed to fetch user data.");
            }

            const statsData = await statsRes.json();
            const interviewsData = await interviewsRes.json();

            setStats(statsData.stats);
            setInterviews(interviewsData.interviews);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const getUserIdAndFetchData = async () => {
            if (status === "authenticated" && session?.user?.email) {
                try {
                    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";
                    const userRes = await fetch(
                        `${backendUrl}/api/db/users/by-email/${session.user.email}`
                    );
                    if (!userRes.ok) {
                        throw new Error("Failed to fetch user profile.");
                    }
                    const userData = await userRes.json();
                    if (userData.success && userData.user) {
                        fetchUserData(userData.user.id);
                    } else {
                        throw new Error(userData.message || "Could not find user.");
                    }
                } catch (err) {
                    const errorMessage =
                        err instanceof Error ? err.message : "Failed to load user data";
                    setError(errorMessage);
                    setLoading(false);
                }
            }
        };

        getUserIdAndFetchData();
    }, [status, session, fetchUserData]);

    if (status === "loading" || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-sm">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Unavailable</h2>
                    <p className="text-gray-600 mb-4">
                        {error.includes("timed out") || error.includes("database") || error.includes("Database")
                            ? "The database connection is currently unavailable. Your practice history and statistics cannot be loaded."
                            : error}
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        You can still practice interviews without saving your progress.
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/"
                            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium"
                        >
                            Start Practicing
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
                <p className="text-gray-600 mb-6">Please sign in to view your dashboard.</p>
                <Link
                    href="/api/auth/signin"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
                >
                    Sign In
                </Link>
            </div>
        );
    }

    const skillData = [
        { name: "Behavioral", level: stats?.behavioralSkill || 0 },
        { name: "Technical", level: stats?.technicalSkill || 0 },
        { name: "Communication", level: stats?.communicationSkill || 0 },
    ];

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen font-sans">
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Your Dashboard</h1>
                    <p className="text-md text-gray-600 mt-1">
                        Welcome back, {session?.user?.name || "User"}!
                    </p>
                </div>
                <Link
                    href="/analytics"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium"
                >
                    📈 View Analytics
                </Link>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
                <StatCard title="Total Interviews" value={stats?.totalInterviews ?? "0"} />
                <StatCard title="Avg. Score" value={stats?.averageScore?.toFixed(1) ?? "0.0"} />
                <StatCard title="Questions Answered" value={stats?.totalAnswers ?? "0"} />
                <StatCard title="Avg. Clarity" value={stats?.averageClarity ?? "0.0"} />
                <StatCard title="Current Streak" value={stats?.currentStreak ?? 0} unit="days" />
            </div>

            {/* Skills & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Skill Levels */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Skill Levels</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={skillData}
                            layout="vertical"
                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="level" fill="#3b82f6" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Interview History */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Interview History</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Job Role
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Company
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Date
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Score
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">View</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {interviews.length > 0 ? (
                                    interviews.map((interview) => (
                                        <tr key={interview.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {interview.jobRole}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {interview.company}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(interview.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${interview.status === "completed"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                >
                                                    {interview.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                                                {interview.overallScore?.toFixed(1) ?? "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={`/interview/${interview.id}`}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-10 text-center text-sm text-gray-500"
                                        >
                                            You haven&apos;t completed any interviews yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
