import { useState } from 'react'
import { supabase } from '../lib/supabase'

function CompleteUpdateModal({ update, onClose, onCompleted }) {
    const [changeDescription, setChangeDescription] = useState('')
    const [imageFile, setImageFile] = useState(null)
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!changeDescription.trim()) return

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

        // 1. Insert note into tasks table with status 'done'
        const { data: newTask, error: taskError } = await supabase
            .from('tasks')
            .insert({
                name: update.title,
                description: update.description,
                image_url: null,
                status: 'done',
            })
            .select()
            .single()

        if (taskError) {
            console.error('Insert task error:', taskError)
            setSaving(false)
            return
        }

        // 2. Add change history to task_history
        const { error: historyError } = await supabase.from('task_history').insert({
            task_id: newTask.id,
            description: changeDescription,
            image_url: imageUrl,
        })

        if (historyError) {
            console.error('History insert error:', historyError)
            setSaving(false)
            return
        }

        // 3. Delete note from changes
        const { error: deleteError } = await supabase
            .from('changes')
            .delete()
            .eq('id', update.id)

        setSaving(false)
        if (deleteError) {
            console.error('Delete change error:', deleteError)
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
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <h2 className="text-base font-semibold text-gray-900">Complete Note to Done</h2>
                </div>
                <p className="text-sm text-gray-500 mb-5 ml-4">{update.title}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            What changed / Completion notes
                        </label>
                        <textarea
                            value={changeDescription}
                            onChange={(e) => setChangeDescription(e.target.value)}
                            placeholder="Describe what was accomplished..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                            rows={3}
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Proof / Attachment Image (optional)
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
                            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Mark as Done'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CompleteUpdateModal
