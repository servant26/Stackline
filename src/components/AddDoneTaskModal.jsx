import { useState } from 'react'
import { supabase } from '../lib/supabase'

async function uploadImage(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    const { error } = await supabase.storage.from('task-images').upload(fileName, file)
    if (error) throw error

    const { data } = supabase.storage.from('task-images').getPublicUrl(fileName)
    return data.publicUrl
}

function AddDoneTaskModal({ onClose, onAdded }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [imageFile, setImageFile] = useState(null)
    const [changeDescription, setChangeDescription] = useState('')
    const [changeImageFile, setChangeImageFile] = useState(null)
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!name.trim() || !changeDescription.trim()) return

        setSaving(true)

        try {
            let imageUrl = null
            if (imageFile) imageUrl = await uploadImage(imageFile)

            let changeImageUrl = null
            if (changeImageFile) changeImageUrl = await uploadImage(changeImageFile)

            const { data: task, error: insertError } = await supabase
                .from('tasks')
                .insert({
                    name,
                    description: description || null,
                    image_url: imageUrl,
                    status: 'done',
                })
                .select()
                .single()

            if (insertError) throw insertError

            const { error: historyError } = await supabase.from('task_history').insert({
                task_id: task.id,
                description: changeDescription,
                image_url: changeImageUrl,
            })

            if (historyError) throw historyError

            onAdded()
            onClose()
        } catch (err) {
            console.error('Error:', err)
        } finally {
            setSaving(false)
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
                    <h2 className="text-base font-semibold text-gray-900">Tambah Tugas (Langsung Selesai)</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Nama Tugas
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Deskripsi Tugas (opsional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Gambar Tugas (opsional)
                        </label>
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200"
                        />
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Apa yang berubah?
                        </label>
                        <textarea
                            value={changeDescription}
                            onChange={(e) => setChangeDescription(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                            rows={3}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Gambar Bukti Perubahan (opsional)
                        </label>
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={(e) => setChangeImageFile(e.target.files[0])}
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
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddDoneTaskModal