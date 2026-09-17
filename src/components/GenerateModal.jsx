function GenerateModal({ onClose }) {
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
                    <h2 className="text-base font-semibold text-gray-900">Generate</h2>
                </div>

                <p className="text-sm text-gray-400">Konten menyusul.</p>

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