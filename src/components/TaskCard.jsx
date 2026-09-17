import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import { supabase } from '../lib/supabase'

function TaskCard({ task, onClick, statusLabel, statusColor, onDeleted }) {
    const [showConfirmDelete, setShowConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    })

    const style = transform
        ? {
            transform: `translate(${transform.x}px, ${transform.y}px)`,
            zIndex: 50,
        }
        : undefined

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

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                onClick={() => onClick?.(task)}
                className={`rounded-lg border border-gray-200 bg-white p-3 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isDragging ? 'opacity-50 shadow-lg cursor-grabbing' : ''
                    }`}
            >
                {task.image_url && (
                    <img
                        src={task.image_url}
                        alt={task.name}
                        className="w-full h-28 object-cover rounded-md mb-2 pointer-events-none"
                    />
                )}
                <p className="font-medium text-gray-800 text-sm">{task.name}</p>
                {task.description && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{task.description}</p>
                )}
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                        {new Date(task.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowConfirmDelete(true)
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                    >
                        Hapus
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