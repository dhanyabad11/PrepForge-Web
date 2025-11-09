"use client";

import { useVoiceRecording } from "@/hooks/useVoiceRecording";

interface VoiceRecorderProps {
    onRecordingComplete?: (blob: Blob, duration: number) => void;
    maxDuration?: number;
}

export function VoiceRecorder({ onRecordingComplete, maxDuration = 300 }: VoiceRecorderProps) {
    const {
        isRecording,
        isPaused,
        audioURL,
        formattedTime,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        resetRecording,
    } = useVoiceRecording({ onRecordingComplete, maxDuration });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Voice Answer</h3>
                <div className="flex items-center gap-2">
                    {isRecording && (
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-3 h-3 rounded-full ${
                                    isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                                }`}
                            />
                            <span className="text-sm font-mono text-gray-700">{formattedTime}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {!isRecording && !audioURL && (
                    <button
                        onClick={startRecording}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Start Recording
                    </button>
                )}

                {isRecording && (
                    <div className="flex gap-2">
                        {!isPaused ? (
                            <button
                                onClick={pauseRecording}
                                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                            >
                                ⏸ Pause
                            </button>
                        ) : (
                            <button
                                onClick={resumeRecording}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                ▶ Resume
                            </button>
                        )}
                        <button
                            onClick={stopRecording}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            ⏹ Stop
                        </button>
                    </div>
                )}

                {audioURL && !isRecording && (
                    <div className="space-y-3">
                        <audio id="recorded-audio" src={audioURL} className="w-full" controls />
                        <div className="flex gap-2">
                            <button
                                onClick={resetRecording}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                🔄 Record Again
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                            Duration: {formattedTime}
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">
                    💡 Tip: Speak clearly and take your time. You can pause and resume recording if
                    needed.
                </p>
            </div>
        </div>
    );
}
