import { useState, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import TaskCard from './TaskCard'

const PAGE_SIZE = 10

const STATUS_CONFIG = {
    todo: { label: 'To Do', dot: 'bg-orange-400', badge: 'bg-orange-100 text-orange-600' },
    done: { label: 'Done', dot: 'bg-blue-600', badge: 'bg-blue-100 text-blue-700' },
}

function Column({ id, title, tasks, onTaskClick, onAddClick, addLabel, onDeleted }) {
    const { setNodeRef, isOver } = useDroppable({ id })
    const config = STATUS_CONFIG[id] || { label: title, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' }
    const [page, setPage] = useState(1)

    const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE))

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [tasks.length, totalPages, page])

    const paginatedTasks = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <div
            ref={setNodeRef}
            className={`bg-gray-50 rounded-xl p-3 min-h-[300px] max-h-[calc(100vh-140px)] flex flex-col transition-colors ${isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
                }`}
        >
            <div className="flex items-center gap-2 mb-3 px-1 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
                    {tasks.length}
                </span>
            </div>

            {onAddClick && (
                <button
                    onClick={onAddClick}
                    className="w-full mb-3 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium flex-shrink-0"
                >
                    + {addLabel}
                </button>
            )}

            <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
                {tasks.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No tasks yet</p>
                ) : (
                    paginatedTasks.map((task) => (
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

            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-200/70 flex-shrink-0 text-xs">
                    <span className="text-gray-400 font-medium">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-2.5 py-1 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-blue-600 disabled:cursor-not-allowed font-medium"
                        >
                            ← Prev
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-2.5 py-1 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-blue-600 disabled:cursor-not-allowed font-medium"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Column