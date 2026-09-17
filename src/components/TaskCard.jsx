import { useDraggable } from '@dnd-kit/core'

function TaskCard({ task, onClick, statusLabel, statusColor }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    })

    const style = transform
        ? {
            transform: `translate(${transform.x}px, ${transform.y}px)`,
            zIndex: 50,
        }
        : undefined

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onClick?.(task)}
            className={`rounded-xl border border-gray-200 bg-white p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isDragging ? 'opacity-50 shadow-lg' : ''
                }`}
        >
            <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                <span className="text-xs font-medium text-gray-500">{statusLabel}</span>
            </div>

            {task.image_url && (
                <img
                    src={task.image_url}
                    alt={task.name}
                    className="w-full h-28 object-cover rounded-lg mb-2 pointer-events-none"
                />
            )}

            <p className="font-semibold text-gray-900 text-sm mb-1">{task.name}</p>
            {task.description && (
                <p className="text-gray-500 text-xs line-clamp-2">{task.description}</p>
            )}

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-gray-400">
                <span className="text-[11px] flex items-center gap-1">
                    📅 {new Date(task.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })}
                </span>
                <span className="text-[11px] text-blue-500 font-medium">Detail →</span>
            </div>
        </div>
    )
}

export default TaskCard