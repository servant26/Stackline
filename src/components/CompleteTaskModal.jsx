import { useState } from 'react'
import { supabase } from '../lib/supabase'

function CompleteTaskModal({ task, onClose, onCompleted }) {
    const [description, setDescription] = useState('')
    const [imageFile, setImageFile] = useState(null)
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!description.trim()) return

        setSaving(true)
        let imageUrl = null

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('task-images')
                .upload(fileName, imageFile)

            if (uploadError) {
                console.error('Upload error:', uploadError)
                setSaving(false)
                return
            }

            const { data: publicUrlData } = supabase.storage
                .from('task-images')
                .getPublicUrl(fileName)

            imageUrl = publicUrlData.publicUrl
        }

        const { error: historyError } = await supabase.from('task_history').insert({
            task_id: task.id,
            description,
            image_url: imageUrl,
        })

        if (historyError) {
            console.error('History insert error:', historyError)
            setSaving(false)
            return
        }

        const { error: updateError } = await supabase
            .from('tasks')
            .update({ status: 'done' })
            .eq('id', task.id)

        setSaving(false)
        if (updateError) {
            console.error('Update error:', updateError)
            return
        }

        onCompleted()
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
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h2 className="text-base font-semibold text-gray-900">Selesaikan Tugas</h2>
                </div>
                <p className="text-sm text-gray-500 mb-5 ml-4">{task.name}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Apa yang berubah?
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                            rows={3}
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Upload Gambar (opsional)
                        </label>
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200"
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
                            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Selesai'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CompleteTaskModal