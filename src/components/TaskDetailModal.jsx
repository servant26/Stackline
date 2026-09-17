import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 5

function TaskDetailModal({ task, onClose, onDeleted }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    useEffect(() => {
        fetchHistory()
    }, [])

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
            setHistory(data)
        }
        setLoading(false)
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
                className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 w-full max-w-3xl max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-2">
                        <span
                            className={`w-2 h-2 rounded-full mt-1.5 ${task.status === 'done' ? 'bg-blue-600' : 'bg-orange-400'
                                }`}
                        />
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">{task.name}</h2>
                            {task.description && (
                                <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-sm w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                        ✕
                    </button>
                </div>

                {task.image_url && (
                    <img
                        src={task.image_url}
                        alt={task.name}
                        className="w-full h-48 object-cover rounded-xl mb-4 border border-gray-100"
                    />
                )}

                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Riwayat Perubahan {totalCount > 0 && `(${totalCount})`}
                </h3>

                {loading ? (
                    <p className="text-sm text-gray-400">Memuat riwayat...</p>
                ) : history.length === 0 ? (
                    <p className="text-sm text-gray-400">Belum ada riwayat.</p>
                ) : (
                    <>
                        <div className="space-y-2.5">
                            {paginatedHistory.map((h, idx) => (
                                <div
                                    key={h.id}
                                    className="border border-gray-100 rounded-xl p-3 bg-gray-50"
                                >
                                    <p className="text-[11px] text-gray-400 mb-1">
                                        Perubahan #{totalCount - ((page - 1) * PAGE_SIZE + idx)} —{' '}
                                        {new Date(h.created_at).toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-sm text-gray-700">{h.description}</p>
                                    {h.image_url && (
                                        <img
                                            src={h.image_url}
                                            alt="Bukti perubahan"
                                            className="w-full h-40 object-cover rounded-lg mt-2 border border-gray-100"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    ← Sebelumnya
                                </button>
                                <span className="text-xs text-gray-400">
                                    Halaman {page} dari {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Selanjutnya →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default TaskDetailModal