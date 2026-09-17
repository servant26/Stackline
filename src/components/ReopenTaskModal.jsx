import { useState } from 'react'
import { supabase } from '../lib/supabase'

function ReopenTaskModal({ task, onClose, onReopened }) {
    const [reason, setReason] = useState('')
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!reason.trim()) return

        setSaving(true)

        const { error: historyError } = await supabase.from('task_history').insert({
            task_id: task.id,
            description: `Reopened: ${reason}`,
            image_url: null,
        })

        if (historyError) {
            console.error('History insert error:', historyError)
            setSaving(false)
            return
        }

        const { error: updateError } = await supabase
            .from('tasks')
            .update({ status: 'todo' })
            .eq('id', task.id)

        setSaving(false)
        if (updateError) {
            console.error('Update error:', updateError)
            return
        }

        onReopened()
        onClose()
    }

    return (
        <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Reopen Task</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 ml-4">{task.name}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Reason for reopening
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why this task is being moved back to To Do..."
                            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 focus:border-blue-300 dark:focus:border-blue-500"
                            rows={3}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm rounded-lg bg-blue-600 dark:bg-transparent dark:border dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs"
                        >
                            {saving ? 'Saving...' : 'Reopen Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ReopenTaskModal