import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import { supabase } from '../lib/supabase'

function UpdateCard({ update, onClick, onDeleted }) {
    const [showConfirmDelete, setShowConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `update-${update.id}`,
        data: { type: 'update', update },
    })

    async function handleDelete() {
        setDeleting(true)
        const { error } = await supabase.from('changes').delete().eq('id', update.id)
        setDeleting(false)

        if (error) {
            console.error('Delete error:', error)
            return
        }

        setShowConfirmDelete(false)
        onDeleted?.()
    }

    return (
        <>
            <div
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                onClick={() => onClick?.(update)}
                className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md transition-all cursor-grab touch-manipulation flex-shrink-0 w-[82vw] sm:w-[320px] md:w-full md:mb-3 snap-center flex flex-col justify-between ${
                    isDragging ? 'opacity-25 border-dashed border-gray-300 dark:border-gray-700' : ''
                }`}
            >
                <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-[13px] md:text-sm mb-1">{update.title}</p>
                {update.description && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-[11.5px] md:text-xs line-clamp-2">{update.description}</p>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {new Date(update.created_at).toLocaleString('en-US', {
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
                    taskName={update.title}
                    onCancel={() => setShowConfirmDelete(false)}
                    onConfirm={handleDelete}
                    deleting={deleting}
                />
            )}
        </>
    )
}

export default UpdateCard