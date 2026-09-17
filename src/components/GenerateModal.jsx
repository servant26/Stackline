import { useState } from 'react'
import { supabase } from '../lib/supabase'

function GenerateModal({ onClose }) {
    const [period, setPeriod] = useState('week')
    const [status, setStatus] = useState('done')
    const [loading, setLoading] = useState(false)
    const [summary, setSummary] = useState(null)
    const [error, setError] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setSummary(null)
        setError(null)

        try {
            const { data, error: fnError } = await supabase.functions.invoke('generate-summary', {
                body: { period, status },
            })

            console.log('Function response:', { data, fnError })

            if (fnError) throw fnError

            setSummary(data.summary)
        } catch (err) {
            console.error('Generate error full:', err)
            console.error('Error message:', err.message)
            console.error('Error context:', err.context)
            setError('Gagal membuat ringkasan. Coba lagi.')
        }
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
                <div className="flex items-center gap-2 mb-5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h2 className="text-base font-semibold text-gray-900">Generate Ringkasan</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Periode
                        </label>
                        <div className="flex gap-2">
                            {[
                                { value: 'today', label: 'Hari Ini' },
                                { value: 'week', label: 'Minggu Ini' },
                                { value: 'month', label: 'Bulan Ini' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setPeriod(opt.value)}
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg border font-medium ${period === opt.value
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Status
                        </label>
                        <div className="flex gap-2">
                            {[
                                { value: 'update', label: 'Update' },
                                { value: 'todo', label: 'To Do' },
                                { value: 'done', label: 'Done' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatus(opt.value)}
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg border font-medium ${status === opt.value
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Membuat ringkasan...' : 'Generate'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
                )}

                {summary && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Ringkasan
                        </h3>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{summary}</p>
                    </div>
                )}

                <div className="flex justify-end pt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    )
}

export default GenerateModal