import { useDroppable } from '@dnd-kit/core'
import TaskCard from './TaskCard'

const STATUS_CONFIG = {
    todo: { label: 'Belum Dikerjakan', dot: 'bg-orange-400', badge: 'bg-orange-100 text-orange-600' },
    done: { label: 'Selesai', dot: 'bg-blue-600', badge: 'bg-blue-100 text-blue-700' },
}

function Column({ id, title, tasks, onTaskClick, onAddClick, addLabel, onDeleted }) {
    const { setNodeRef, isOver } = useDroppable({ id })
    const config = STATUS_CONFIG[id] || { label: title, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' }

    return (
        <div
            ref={setNodeRef}
            className={`bg-gray-50 rounded-xl p-3 min-h-[300px] transition-colors ${isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
                }`}
        >
            <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
                    {tasks.length}
                </span>
            </div>

            {onAddClick && (
                <button
                    onClick={onAddClick}
                    className="w-full mb-3 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                >
                    + {addLabel}
                </button>
            )}

            {tasks.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Belum ada tugas</p>
            ) : (
                tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onClick={onTaskClick}
                        statusLabel={config.label}
                        statusColor={config.dot}
                        onDeleted={onDeleted}
                    />
                ))
            )}
        </div>
    )
}

export default Column