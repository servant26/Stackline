import { useDraggable } from '@dnd-kit/core'

function UpdateCard({ update }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `update-${update.id}`,
        data: { type: 'update', update },
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
            className={`rounded-xl border border-gray-200 bg-white p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 shadow-lg' : ''
                }`}
        >
            <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-xs font-medium text-gray-500">Update</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm mb-1">{update.title}</p>
            {update.description && (
                <p className="text-gray-500 text-xs line-clamp-2">{update.description}</p>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                📅 {new Date(update.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                })}
            </div>
        </div>
    )
}

export default UpdateCard