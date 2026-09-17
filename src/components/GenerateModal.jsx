import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PERIOD_OPTIONS = [
    { value: 'today', label: 'Today', description: 'Activity logged today' },
    { value: 'week', label: 'This Week', description: 'Past 7 days of activity' },
    { value: 'month', label: 'This Month', description: 'Current month summary' },
]

const STATUS_OPTIONS = [
    { value: 'update', label: 'Notes', dot: 'bg-purple-400' },
    { value: 'todo', label: 'To Do', dot: 'bg-orange-400' },
    { value: 'done', label: 'Done', dot: 'bg-blue-600' },
]

function CustomSelect({ label, value, onChange, options }) {
    const [open, setOpen] = useState(false)
    const selectRef = useRef(null)

    const selectedOption = options.find((o) => o.value === value) || options[0]

    useEffect(() => {
        function handleClickOutside(e) {
            if (selectRef.current && !selectRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={selectRef}>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                {label}
            </label>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`w-full flex items-center justify-between rounded-xl border bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 transition-all focus:outline-none ${
                    open
                        ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/40 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-xs'
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption.dot && (
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedOption.dot}`} />
                    )}
                    <span className="font-medium truncate">{selectedOption.label}</span>
                </div>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                        open ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div
                className={`absolute left-0 right-0 z-50 mt-1.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 shadow-xl ring-1 ring-black/5 origin-top transition-all duration-200 ease-out ${
                    open
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
            >
                {options.map((opt) => {
                    const isSelected = opt.value === value
                    const isDisabled = opt.disabled

                    return (
                        <button
                            key={opt.value}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                                if (isDisabled) return
                                onChange(opt.value)
                                setOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                                isDisabled
                                    ? 'opacity-40 cursor-not-allowed bg-gray-50/60 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500'
                                    : isSelected
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {opt.dot && (
                                    <span
                                        className={`w-2 h-2 rounded-full ${
                                            isDisabled ? 'bg-gray-300 dark:bg-gray-600' : opt.dot
                                        }`}
                                    />
                                )}
                                <div className="flex items-center gap-1">
                                    <span className={isSelected ? 'font-semibold' : 'font-medium'}>{opt.label}</span>
                                    {typeof opt.count === 'number' && (
                                        <span
                                            className={`text-sm ${
                                                isDisabled
                                                    ? 'text-gray-400 dark:text-gray-500'
                                                    : isSelected
                                                    ? 'text-blue-700 dark:text-blue-300 font-semibold'
                                                    : 'text-gray-700 dark:text-gray-300 font-medium'
                                            }`}
                                        >
                                            ({opt.count})
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {isDisabled && (
                                    <span className="text-[11px] font-normal text-gray-400 dark:text-gray-500">
                                        No data
                                    </span>
                                )}
                                {isSelected && !isDisabled && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function GenerateModal({ tasks = [], updates = [], onClose }) {
    const [period, setPeriod] = useState('week')
    const [status, setStatus] = useState('todo')
    const [loading, setLoading] = useState(false)
    const [summary, setSummary] = useState(null)
    const [error, setError] = useState(null)

    // Calculate dates
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)

    const monthStart = new Date(now)
    monthStart.setMonth(now.getMonth() - 1)

    // Helper to get items by column
    function getItemsByStatus(s) {
        if (s === 'update') return updates
        return tasks.filter((t) => t.status === s)
    }

    // Helper to filter items by period
    function filterByPeriod(items, p) {
        const threshold = p === 'today' ? todayStart : p === 'week' ? weekStart : monthStart
        return items.filter((item) => new Date(item.created_at) >= threshold)
    }

    // Current items for the selected status
    const currentStatusItems = getItemsByStatus(status)

    // Dynamic Period Options
    const periodOptions = [
        {
            value: 'today',
            label: 'Today',
            count: filterByPeriod(currentStatusItems, 'today').length,
            disabled: filterByPeriod(currentStatusItems, 'today').length === 0,
        },
        {
            value: 'week',
            label: 'This Week',
            count: filterByPeriod(currentStatusItems, 'week').length,
            disabled: filterByPeriod(currentStatusItems, 'week').length === 0,
        },
        {
            value: 'month',
            label: 'This Month',
            count: filterByPeriod(currentStatusItems, 'month').length,
            disabled: filterByPeriod(currentStatusItems, 'month').length === 0,
        },
    ]

    // Dynamic Status Options (calculated across the selected period or overall)
    const statusOptions = [
        {
            value: 'update',
            label: 'Notes',
            dot: 'bg-purple-400',
            count: filterByPeriod(updates, period).length,
            disabled: filterByPeriod(updates, period).length === 0,
        },
        {
            value: 'todo',
            label: 'To Do',
            dot: 'bg-orange-400',
            count: filterByPeriod(tasks.filter((t) => t.status === 'todo'), period).length,
            disabled: filterByPeriod(tasks.filter((t) => t.status === 'todo'), period).length === 0,
        },
        {
            value: 'done',
            label: 'Done',
            dot: 'bg-blue-600',
            count: filterByPeriod(tasks.filter((t) => t.status === 'done'), period).length,
            disabled: filterByPeriod(tasks.filter((t) => t.status === 'done'), period).length === 0,
        },
    ]

    // Auto-select valid status if current status becomes disabled
    useEffect(() => {
        const currentSelectedStatus = statusOptions.find((s) => s.value === status)
        if (currentSelectedStatus?.disabled) {
            const firstAvailable = statusOptions.find((s) => !s.disabled)
            if (firstAvailable) {
                setStatus(firstAvailable.value)
            }
        }
    }, [period, tasks, updates])

    // Auto-select valid period if current period becomes disabled
    useEffect(() => {
        const currentSelectedPeriod = periodOptions.find((p) => p.value === period)
        if (currentSelectedPeriod?.disabled) {
            const firstAvailable = periodOptions.find((p) => !p.disabled)
            if (firstAvailable) {
                setPeriod(firstAvailable.value)
            }
        }
    }, [status, tasks, updates])

    const isCurrentCombinationEmpty = filterByPeriod(currentStatusItems, period).length === 0

    async function handleSubmit(e) {
        e.preventDefault()
        if (isCurrentCombinationEmpty) return

        setLoading(true)
        setSummary(null)
        setError(null)

        try {
            const { data, error: fnError } = await supabase.functions.invoke('generate-summary', {
                body: { period, status },
            })

            if (fnError) throw fnError
            setSummary(data.summary)
        } catch (err) {
            console.error('Generate error full:', err)
            setError('Failed to generate summary. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl p-7 w-full max-w-xl max-h-[90vh] overflow-visible"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Generate Summary</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        title="Close"
                        className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Controls */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <CustomSelect
                            label="Target Column"
                            value={status}
                            onChange={setStatus}
                            options={statusOptions}
                        />

                        <CustomSelect
                            label="Period"
                            value={period}
                            onChange={setPeriod}
                            options={periodOptions}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || isCurrentCombinationEmpty}
                        className="w-full mt-2 px-4 py-2.5 text-sm rounded-xl bg-blue-600 dark:bg-transparent dark:border dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white text-white font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg
                                    className="animate-spin h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8H4z"
                                    />
                                </svg>
                                <span>Generating summary...</span>
                            </>
                        ) : (
                            <span>Generate Summary</span>
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {summary && (
                    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Generated Summary
                            </h3>
                            <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(summary)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                            >
                                Copy Text
                            </button>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 rounded-xl p-4 max-h-[280px] overflow-y-auto">
                            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed text-justify">
                                {summary}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default GenerateModal