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
            description: `Dibuka kembali: ${reason}`,
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
                className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <h2 className="text-base font-semibold text-gray-900">Buka Kembali Tugas</h2>
                </div>
                <p className="text-sm text-gray-500 mb-5 ml-4">{task.name}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Kenapa dibuka lagi?
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300"
                            rows={3}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Buka Kembali'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ReopenTaskModal