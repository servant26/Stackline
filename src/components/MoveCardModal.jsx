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

const TRANSITION_TITLES = {
    'updates-todo': 'Move Note to To Do',
    'updates-done': 'Move Note to Done',
    'todo-updates': 'Move Task to Notes',
    'todo-done': 'Complete Task',
    'done-todo': 'Reopen Task to To Do',
    'done-updates': 'Move Task to Notes',
}

function MoveCardModal({ item, fromColumn, toColumn, onClose, onMoved }) {
    const [reason, setReason] = useState('')
    const [imageFile, setImageFile] = useState(null)
    const [saving, setSaving] = useState(false)

    const isFromUpdate = fromColumn === 'updates'
    const itemName = isFromUpdate ? item.title : item.name
    const transitionKey = `${fromColumn}-${toColumn}`
    const modalTitle = TRANSITION_TITLES[transitionKey] || `Move to ${toColumn === 'updates' ? 'Notes' : toColumn === 'todo' ? 'To Do' : 'Done'}`

    async function handleSubmit(e) {
        e.preventDefault()
        setSaving(true)

        try {
            let uploadedImageUrl = null
            if (imageFile) {
                uploadedImageUrl = await uploadImage(imageFile)
            }

            const trimmedReason = reason.trim()

            if (isFromUpdate) {
                // Moving FROM Notes (changes table)
                if (toColumn === 'todo') {
                    // 1. Create task in tasks table (status: todo)
                    const { data: newTask, error: insertError } = await supabase
                        .from('tasks')
                        .insert({
                            name: item.title,
                            description: item.description,
                            image_url: null,
                            status: 'todo',
                        })
                        .select()
                        .single()

                    if (insertError) throw insertError

                    // 2. If reason or image provided, save to task_history
                    if (trimmedReason || uploadedImageUrl) {
                        await supabase.from('task_history').insert({
                            task_id: newTask.id,
                            description: trimmedReason || 'Moved from Notes to To Do',
                            image_url: uploadedImageUrl,
                        })
                    }

                    // 3. Delete from changes
                    await supabase.from('changes').delete().eq('id', item.id)
                } else if (toColumn === 'done') {
                    // 1. Create task in tasks table (status: done) WITH [FROM_NOTES] marker in description
                    const preservedDescription = item.description || ''
                    const finalDescription = preservedDescription.startsWith('[FROM_NOTES]')
                        ? preservedDescription
                        : `[FROM_NOTES]${preservedDescription}`

                    const { data: newTask, error: insertError } = await supabase
                        .from('tasks')
                        .insert({
                            name: item.title,
                            description: finalDescription,
                            image_url: null,
                            status: 'done',
                        })
                        .select()
                        .single()

                    if (insertError) throw insertError

                    // 2. Save history entry only if user provided reason or image
                    if (trimmedReason || uploadedImageUrl) {
                        await supabase.from('task_history').insert({
                            task_id: newTask.id,
                            description: trimmedReason || 'Proof attachment uploaded',
                            image_url: uploadedImageUrl,
                        })
                    }

                    // 3. Delete from changes
                    await supabase.from('changes').delete().eq('id', item.id)
                }
            } else {
                // Moving FROM tasks (todo or done)
                if (toColumn === 'updates') {
                    // 1. Insert into changes
                    // Clean up [FROM_NOTES] prefix if it had one
                    const cleanDescription = (item.description || '').replace(/^\[FROM_NOTES\]/, '')
                    const { error: changeInsertError } = await supabase
                        .from('changes')
                        .insert({
                            title: item.name,
                            description: cleanDescription || null,
                        })

                    if (changeInsertError) throw changeInsertError

                    // 2. Delete task from tasks (cascade or delete history)
                    await supabase.from('task_history').delete().eq('task_id', item.id)
                    await supabase.from('tasks').delete().eq('id', item.id)
                } else {
                    // Moving between todo and done
                    let updatedDescription = item.description

                    if (fromColumn === 'updates' && toColumn === 'done') {
                        // Handled above in isFromUpdate
                    }

                    // If moving from done to todo, remove [FROM_NOTES] marker so it behaves as regular todo task
                    if (fromColumn === 'done' && toColumn === 'todo' && item.description?.startsWith('[FROM_NOTES]')) {
                        updatedDescription = item.description.replace(/^\[FROM_NOTES\]/, '')
                    }

                    const { error: updateError } = await supabase
                        .from('tasks')
                        .update({
                            status: toColumn,
                            description: updatedDescription,
                        })
                        .eq('id', item.id)

                    if (updateError) throw updateError

                    // Only save to task_history if user provided description or image
                    if (trimmedReason || uploadedImageUrl) {
                        await supabase.from('task_history').insert({
                            task_id: item.id,
                            description: trimmedReason || (toColumn === 'done' ? 'Completed task' : 'Moved back to To Do'),
                            image_url: uploadedImageUrl,
                        })
                    }
                }
            }

            onMoved?.()
            onClose()
        } catch (err) {
            console.error('Error during card move:', err)
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
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">{modalTitle}</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 ml-4">{itemName}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            What changed / Notes (optional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Add explanation, reason, or details of changes (optional)..."
                            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 focus:border-blue-300 dark:focus:border-blue-500"
                            rows={3}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Attachment / Proof Image (optional)
                        </label>
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 dark:file:bg-gray-800 file:text-gray-600 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-700 transition-colors"
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
                            {saving ? 'Moving...' : 'Move Card'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default MoveCardModal
