function ConfirmDeleteModal({ taskName, onCancel, onConfirm, deleting }) {
    return (
        <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <h2 className="text-base font-semibold text-gray-900">Delete Task</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to delete <span className="font-medium text-gray-700">{taskName}</span>? This action cannot be undone, and all associated history will be permanently removed.
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDeleteModal