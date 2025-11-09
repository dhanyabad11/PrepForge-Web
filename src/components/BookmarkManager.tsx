"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface Question {
    id: string;
    question: string;
    type: string;
    difficulty: string;
    category: string;
}

interface SavedQuestionSet {
    id: number;
    title: string;
    description: string | null;
    questions: Question[];
    tags: string[];
    isFavorite: boolean;
    practiceCount: number;
    createdAt: string;
}

interface BookmarkManagerProps {
    userId: number;
    apiUrl?: string;
}

export function BookmarkManager({
    userId,
    apiUrl = "http://localhost:5000",
}: BookmarkManagerProps) {
    const [bookmarks, setBookmarks] = useState<SavedQuestionSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);

    const fetchBookmarks = async () => {
        try {
            const url = selectedTag
                ? `${apiUrl}/api/bookmarks/user/${userId}?tag=${selectedTag}`
                : `${apiUrl}/api/bookmarks/user/${userId}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setBookmarks(data.data);
            }
        } catch (error) {
            console.error("Error fetching bookmarks:", error);
            toast.error("Failed to load saved questions");
        } finally {
            setLoading(false);
        }
    };

    const fetchTags = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/bookmarks/user/${userId}/tags`);
            const data = await response.json();

            if (data.success) {
                setTags(data.data);
            }
        } catch (error) {
            console.error("Error fetching tags:", error);
        }
    };

    useEffect(() => {
        fetchBookmarks();
        fetchTags();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, selectedTag]);

    const toggleFavorite = async (setId: number) => {
        try {
            const response = await fetch(`${apiUrl}/api/bookmarks/${setId}/favorite`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (data.success) {
                setBookmarks((prev) =>
                    prev.map((b) =>
                        b.id === setId ? { ...b, isFavorite: data.data.isFavorite } : b
                    )
                );
                toast.success(
                    data.data.isFavorite ? "Added to favorites" : "Removed from favorites"
                );
            }
        } catch {
            toast.error("Failed to update favorite");
        }
    };

    const deleteBookmark = async (setId: number) => {
        if (!confirm("Are you sure you want to delete this question set?")) return;

        try {
            const response = await fetch(`${apiUrl}/api/bookmarks/${setId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (data.success) {
                setBookmarks((prev) => prev.filter((b) => b.id !== setId));
                toast.success("Question set deleted");
            }
        } catch {
            toast.error("Failed to delete question set");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Saved Questions</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedTag(null)}
                        className={`px-4 py-2 rounded-lg ${
                            !selectedTag ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                        }`}
                    >
                        All
                    </button>
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`px-4 py-2 rounded-lg ${
                                selectedTag === tag
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {bookmarks.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">
                        No saved questions yet. Start practicing to save your favorites!
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {bookmarks.map((bookmark) => (
                        <div
                            key={bookmark.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {bookmark.title}
                                        </h3>
                                        {bookmark.isFavorite && (
                                            <span className="text-yellow-500">⭐</span>
                                        )}
                                    </div>
                                    {bookmark.description && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            {bookmark.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleFavorite(bookmark.id)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        title={
                                            bookmark.isFavorite
                                                ? "Remove from favorites"
                                                : "Add to favorites"
                                        }
                                    >
                                        {bookmark.isFavorite ? "⭐" : "☆"}
                                    </button>
                                    <button
                                        onClick={() => deleteBookmark(bookmark.id)}
                                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{bookmark.questions.length} questions</span>
                                <span>•</span>
                                <span>Practiced {bookmark.practiceCount} times</span>
                                <span>•</span>
                                <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
                            </div>

                            {bookmark.tags && bookmark.tags.length > 0 && (
                                <div className="flex gap-2 mt-3">
                                    {bookmark.tags.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
