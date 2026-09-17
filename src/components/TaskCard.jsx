import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import { supabase } from '../lib/supabase'

function TaskCard({ task, onClick, statusLabel, statusColor, onDeleted }) {
    const [showConfirmDelete, setShowConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
        data: { type: 'task', task },
    })


    async function handleDelete() {
        setDeleting(true)
        const { error } = await supabase.from('tasks').delete().eq('id', task.id)
        setDeleting(false)

        if (error) {
            console.error('Delete error:', error)
            return
        }

        setShowConfirmDelete(false)
        onDeleted?.()
    }

    const isFromNotes = task.description?.startsWith('[FROM_NOTES]')
    const displayDescription = isFromNotes
        ? task.description.replace(/^\[FROM_NOTES\]/, '')
        : task.description

    const badgeLabel = (task.status === 'done' && isFromNotes)
        ? 'From Notes'
        : (statusLabel || (task.status === 'done' ? 'Done' : 'To Do'))

    const badgeColor = (task.status === 'done' && isFromNotes)
        ? 'bg-purple-400'
        : (statusColor || (task.status === 'done' ? 'bg-blue-600' : 'bg-orange-400'))

    return (
        <>
            <div
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                onClick={() => onClick?.(task)}
                className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 mb-3 shadow-sm hover:shadow-md transition-all cursor-grab ${
                    isDragging ? 'opacity-25 border-dashed border-gray-300 dark:border-gray-700' : ''
                }`}
            >
                <div className="flex items-center gap-1.5 mb-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${badgeColor}`} />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {badgeLabel}
                    </span>
                </div>

                {task.image_url && (
                    <img
                        src={task.image_url}
                        alt={task.name}
                        className="w-full h-28 object-cover rounded-lg mb-2 pointer-events-none"
                    />
                )}
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{task.name}</p>
                {displayDescription && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2">{displayDescription}</p>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {new Date(task.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        })}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowConfirmDelete(true)
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 font-medium transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {showConfirmDelete && (
                <ConfirmDeleteModal
                    taskName={task.name}
                    onCancel={() => setShowConfirmDelete(false)}
                    onConfirm={handleDelete}
                    deleting={deleting}
                />
            )}
        </>
    )
}

export default TaskCard