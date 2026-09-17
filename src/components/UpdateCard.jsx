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
                className={`rounded-xl border border-gray-200 bg-white p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-grab ${isDragging ? 'opacity-25 border-dashed border-gray-300' : ''
                    }`}
            >
                <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-xs font-medium text-gray-500">Notes</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{update.title}</p>
                {update.description && (
                    <p className="text-gray-500 text-xs line-clamp-2">{update.description}</p>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
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
                        className="text-[11px] px-2.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 font-medium"
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