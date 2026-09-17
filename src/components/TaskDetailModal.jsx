import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 5

function TaskDetailModal({ task, onClose, onUpdated }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    // Edit state
    const isFromNotes = task.description?.startsWith('[FROM_NOTES]')
    const initialRawDesc = task.description || ''
    const initialDisplayDesc = isFromNotes ? initialRawDesc.replace(/^\[FROM_NOTES\]/, '') : initialRawDesc

    const [isEditing, setIsEditing] = useState(false)
    const [currentTask, setCurrentTask] = useState(task)
    const [name, setName] = useState(task.name)
    const [description, setDescription] = useState(initialDisplayDesc)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchHistory()
    }, [])

    const DEFAULT_AUTO_LOGS = [
        'Completed task',
        'Completed from Notes',
        'Moved back to To Do',
        'Moved from Notes to To Do',
        'Reopened: Moved back to To Do',
    ]

    async function fetchHistory() {
        setLoading(true)
        const { data, error } = await supabase
            .from('task_history')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching history:', error)
        } else {
            // Filter out default auto-generated log entries that have no image
            const meaningfulHistory = (data || []).filter((item) => {
                if (item.image_url) return true
                const text = (item.description || '').trim()
                if (!text) return false
                return !DEFAULT_AUTO_LOGS.includes(text)
            })
            setHistory(meaningfulHistory)
        }
        setLoading(false)
    }

    async function handleSaveEdit(e) {
        e.preventDefault()
        if (!name.trim()) return

        setSaving(true)
        const trimmedDesc = description.trim()
        const finalDescription = (isFromNotes && trimmedDesc)
            ? `[FROM_NOTES]${trimmedDesc}`
            : (trimmedDesc || null)

        const { error } = await supabase
            .from('tasks')
            .update({
                name: name.trim(),
                description: finalDescription,
            })
            .eq('id', task.id)

        setSaving(false)
        if (error) {
            console.error('Update task error:', error)
            return
        }

        setCurrentTask((prev) => ({
            ...prev,
            name: name.trim(),
            description: finalDescription,
        }))
        setIsEditing(false)
        onUpdated?.()
    }

    function handleCancelEdit() {
        setName(currentTask.name)
        setDescription(currentTask.description || '')
        setIsEditing(false)
    }

    const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE))
    const paginatedHistory = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const totalCount = history.length

    return (
        <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl p-6 sm:p-7 w-full max-w-lg max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header bar */}
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <span
                            className={`w-2 h-2 rounded-full ${
                                currentTask.status === 'done' && isFromNotes
                                    ? 'bg-purple-400'
                                    : currentTask.status === 'done'
                                    ? 'bg-blue-600'
                                    : 'bg-orange-400'
                            }`}
                        />
                        <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                currentTask.status === 'done' && isFromNotes
                                    ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                                    : currentTask.status === 'done'
                                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                                    : 'bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300'
                            }`}
                        >
                            {currentTask.status === 'done' && isFromNotes ? 'From Notes' : currentTask.status === 'done' ? 'Done' : 'To Do'}
                        </span>
                        {currentTask.created_at && (
                            <>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(currentTask.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </span>
                            </>
                        )}
                    </div>
                    {!isEditing && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            title="Edit Task"
                            className="text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors flex items-center justify-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                {!isEditing ? (
                    <div className="space-y-5">
                        {/* Title */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                                {currentTask.name}
                            </h2>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                                Description
                            </h4>
                            {currentTask.description ? (
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-justify">
                                    {currentTask.description.replace(/^\[FROM_NOTES\]/, '')}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No description provided.</p>
                            )}
                        </div>

                        {/* Attachment Image */}
                        {task.image_url && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                    Attachment Image
                                </h4>
                                <img
                                    src={task.image_url}
                                    alt={task.name}
                                    className="w-full max-h-64 object-cover rounded-xl border border-gray-100 dark:border-gray-800"
                                />
                            </div>
                        )}

                        {/* Activity & History */}
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                                Activity History {totalCount > 0 && `(${totalCount})`}
                            </h4>

                            {loading ? (
                                <p className="text-sm text-gray-400 dark:text-gray-500">Loading history...</p>
                            ) : history.length === 0 ? (
                                <div className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-lg px-3.5 py-3 text-sm text-gray-400 dark:text-gray-500 italic">
                                    No activity history recorded yet.
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {paginatedHistory.map((h, idx) => (
                                        <div
                                            key={h.id}
                                            className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50 dark:bg-gray-800/40"
                                        >
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">
                                                Update #{totalCount - ((page - 1) * PAGE_SIZE + idx)} —{' '}
                                                {new Date(h.created_at).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-justify">{h.description}</p>
                                            {h.image_url && (
                                                <img
                                                    src={h.image_url}
                                                    alt="Proof attachment"
                                                    className="w-full h-40 object-cover rounded-lg mt-2 border border-gray-100 dark:border-gray-800"
                                                />
                                            )}
                                        </div>
                                    ))}

                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                            <button
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                                            >
                                                ← Prev
                                            </button>
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                Page {page} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSaveEdit} className="w-full space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                                Task Title :
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3.5 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 focus:border-blue-300 dark:focus:border-blue-500"
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                                Description :
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3.5 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 focus:border-blue-300 dark:focus:border-blue-500"
                                placeholder="Add task description..."
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2 text-xs rounded-lg bg-blue-600 dark:bg-transparent dark:border dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white text-white font-medium hover:bg-blue-700 disabled:opacity-50 shadow-xs transition-all"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default TaskDetailModal