import { useState, useEffect } from 'react'
import { DndContext, useSensor, useSensors, PointerSensor, useDroppable } from '@dnd-kit/core'
import { supabase } from './lib/supabase'
import AddTaskModal from './components/AddTaskModal'
import AddUpdateModal from './components/AddUpdateModal'
import AddDoneTaskModal from './components/AddDoneTaskModal'
import CompleteTaskModal from './components/CompleteTaskModal'
import ReopenTaskModal from './components/ReopenTaskModal'
import TaskDetailModal from './components/TaskDetailModal'
import GenerateModal from './components/GenerateModal'
import Column from './components/Column'
import UpdateCard from './components/UpdateCard'

function UpdatesColumn({ updates, onAddClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'updates' })

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 rounded-xl p-3 min-h-[300px] transition-colors ${isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
        }`}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2 h-2 rounded-full bg-purple-400" />
        <h2 className="font-semibold text-gray-800 text-sm">Updates</h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
          {updates.length}
        </span>
      </div>

      <button
        onClick={onAddClick}
        className="w-full mb-3 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
      >
        + Tambah Update
      </button>

      {updates.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">Tidak ada catatan</p>
      ) : (
        updates.map((update) => <UpdateCard key={update.id} update={update} />)
      )}
    </div>
  )
}

function App() {
  const [tasks, setTasks] = useState([])
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showAddUpdateModal, setShowAddUpdateModal] = useState(false)
  const [showAddDoneModal, setShowAddDoneModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [taskToComplete, setTaskToComplete] = useState(null)
  const [taskToReopen, setTaskToReopen] = useState(null)
  const [taskToView, setTaskToView] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [tasksRes, updatesRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('changes').select('*').order('created_at', { ascending: false }),
    ])

    if (tasksRes.error) console.error('Error fetching tasks:', tasksRes.error)
    else setTasks(tasksRes.data)

    if (updatesRes.error) console.error('Error fetching updates:', updatesRes.error)
    else setUpdates(updatesRes.data)

    setLoading(false)
  }

  const query = searchQuery.trim().toLowerCase()

  function matchesQuery(name, description) {
    if (!query) return true
    return (
      name?.toLowerCase().includes(query) ||
      description?.toLowerCase().includes(query)
    )
  }

  const filteredTasks = tasks.filter((t) => matchesQuery(t.name, t.description))
  const filteredUpdates = updates.filter((u) => matchesQuery(u.title, u.description))

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo')
  const doneTasks = filteredTasks.filter((t) => t.status === 'done')

  async function convertUpdateToTask(update) {
    const { error: insertError } = await supabase.from('tasks').insert({
      name: update.title,
      description: update.description,
      image_url: null,
      status: 'todo',
    })

    if (insertError) {
      console.error('Convert insert error:', insertError)
      return
    }

    const { error: deleteError } = await supabase
      .from('changes')
      .delete()
      .eq('id', update.id)

    if (deleteError) {
      console.error('Convert delete error:', deleteError)
    }

    fetchAll()
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return

    const isUpdate = active.data.current?.type === 'update'

    if (isUpdate) {
      if (over.id === 'todo') {
        convertUpdateToTask(active.data.current.update)
      }
      return
    }

    const taskId = active.id
    const targetColumn = over.id

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === targetColumn) return

    if (targetColumn === 'done') {
      setTaskToComplete(task)
    } else if (targetColumn === 'todo') {
      setTaskToReopen(task)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stackline</h1>
            <p className="text-sm text-gray-500">Kelola tugasmu dalam satu papan.</p>
          </div>

          <div className="flex items-center gap-2 w-full max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan atau tugas..."
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
            <button
              onClick={() => setShowGenerateModal(true)}
              className="whitespace-nowrap px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              Generate
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Memuat...</p>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-3 gap-4">
              <UpdatesColumn updates={filteredUpdates} onAddClick={() => setShowAddUpdateModal(true)} />
              <Column
                id="todo"
                title="To Do"
                tasks={todoTasks}
                onTaskClick={setTaskToView}
                onAddClick={() => setShowAddTaskModal(true)}
                addLabel="Tambah Tugas"
                onDeleted={fetchAll}
              />
              <Column
                id="done"
                title="Done"
                tasks={doneTasks}
                onTaskClick={setTaskToView}
                onAddClick={() => setShowAddDoneModal(true)}
                addLabel="Tambah Tugas"
                onDeleted={fetchAll}
              />
            </div>
          </DndContext>
        )}

        {showAddTaskModal && (
          <AddTaskModal
            onClose={() => setShowAddTaskModal(false)}
            onTaskAdded={fetchAll}
          />
        )}

        {showAddUpdateModal && (
          <AddUpdateModal
            onClose={() => setShowAddUpdateModal(false)}
            onAdded={fetchAll}
          />
        )}

        {showAddDoneModal && (
          <AddDoneTaskModal
            onClose={() => setShowAddDoneModal(false)}
            onAdded={fetchAll}
          />
        )}

        {showGenerateModal && (
          <GenerateModal onClose={() => setShowGenerateModal(false)} />
        )}

        {taskToComplete && (
          <CompleteTaskModal
            task={taskToComplete}
            onClose={() => setTaskToComplete(null)}
            onCompleted={fetchAll}
          />
        )}

        {taskToReopen && (
          <ReopenTaskModal
            task={taskToReopen}
            onClose={() => setTaskToReopen(null)}
            onReopened={fetchAll}
          />
        )}

        {taskToView && (
          <TaskDetailModal task={taskToView} onClose={() => setTaskToView(null)} />
        )}
      </div>
    </div>
  )
}

export default App