import { useState } from 'react'
import { supabase } from '../lib/supabase'

function UpdateDetailModal({ update, onClose, onUpdated }) {
    const [isEditing, setIsEditing] = useState(false)
    const [currentUpdate, setCurrentUpdate] = useState(update)
    const [title, setTitle] = useState(update.title)
    const [description, setDescription] = useState(update.description || '')
    const [saving, setSaving] = useState(false)

    async function handleSaveEdit(e) {
        e.preventDefault()
        if (!title.trim()) return

        setSaving(true)
        const { error } = await supabase
            .from('changes')
            .update({
                title: title.trim(),
                description: description.trim() || null,
            })
            .eq('id', update.id)

        setSaving(false)
        if (error) {
            console.error('Update changes error:', error)
            return
        }

        setCurrentUpdate((prev) => ({
            ...prev,
            title: title.trim(),
            description: description.trim() || null,
        }))
        setIsEditing(false)
        onUpdated?.()
    }

    function handleCancelEdit() {
        setTitle(currentUpdate.title)
        setDescription(currentUpdate.description || '')
        setIsEditing(false)
    }

    return (
        <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-7 w-full max-w-lg max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header bar */}
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                            Notes
                        </span>
                        {currentUpdate.created_at && (
                            <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-gray-500">
                                    {new Date(currentUpdate.created_at).toLocaleDateString('en-US', {
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
                            title="Edit Note"
                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center"
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
                            <h2 className="text-lg font-bold text-gray-900 leading-snug">
                                {currentUpdate.title}
                            </h2>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                                Description
                            </h4>
                            {currentUpdate.description ? (
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line text-justify">
                                    {currentUpdate.description}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No description provided.</p>
                            )}
                        </div>

                        {/* Attachment Image */}
                        {currentUpdate.image_url && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Attachment Image
                                </h4>
                                <img
                                    src={currentUpdate.image_url}
                                    alt={currentUpdate.title}
                                    className="w-full max-h-64 object-cover rounded-xl border border-gray-100"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSaveEdit} className="w-full space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Note Title :
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Description :
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                                placeholder="Add note description..."
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-4 py-2 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2 text-xs rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm"
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

export default UpdateDetailModal