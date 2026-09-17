import { useState, useEffect } from 'react'
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import { supabase } from './lib/supabase'
import AddTaskModal from './components/AddTaskModal'
import AddUpdateModal from './components/AddUpdateModal'
import AddDoneTaskModal from './components/AddDoneTaskModal'
import TaskDetailModal from './components/TaskDetailModal'
import UpdateDetailModal from './components/UpdateDetailModal'
import GenerateModal from './components/GenerateModal'
import MoveCardModal from './components/MoveCardModal'
import Column from './components/Column'
import UpdateCard from './components/UpdateCard'

const COLUMN_PAGE_SIZE = 10

function UpdatesColumn({ updates, onAddClick, onUpdateClick, onDeleted }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'updates' })
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(updates.length / COLUMN_PAGE_SIZE))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [updates.length, totalPages, page])

  const paginatedUpdates = updates.slice((page - 1) * COLUMN_PAGE_SIZE, page * COLUMN_PAGE_SIZE)

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 rounded-xl p-3 min-h-[300px] max-h-[calc(100vh-140px)] flex flex-col transition-colors ${isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
        }`}
    >
      <div className="flex items-center gap-2 mb-3 px-1 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-purple-400" />
        <h2 className="font-semibold text-gray-800 text-sm">Notes</h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
          {updates.length}
        </span>
      </div>

      <button
        onClick={onAddClick}
        className="w-full mb-3 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium flex-shrink-0"
      >
        + Add Note
      </button>

      <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
        {updates.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No notes yet</p>
        ) : (
          paginatedUpdates.map((update) => (
            <UpdateCard
              key={update.id}
              update={update}
              onClick={onUpdateClick}
              onDeleted={onDeleted}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-200/70 flex-shrink-0 text-xs">
          <span className="text-gray-400 font-medium">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-blue-600 disabled:cursor-not-allowed font-medium"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-blue-600 disabled:cursor-not-allowed font-medium"
            >
              Next →
            </button>
          </div>
        </div>
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
  const [moveTransition, setMoveTransition] = useState(null)
  const [taskToView, setTaskToView] = useState(null)
  const [updateToView, setUpdateToView] = useState(null)

  const [activeDragItem, setActiveDragItem] = useState(null)

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
      supabase.from('tasks').select('*'),
      supabase.from('changes').select('*'),
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
    const cleanDesc = description?.replace(/^\[FROM_NOTES\]/, '') || ''
    return (
      name?.toLowerCase().includes(query) ||
      cleanDesc.toLowerCase().includes(query)
    )
  }

  const filteredTasks = tasks.filter((t) => matchesQuery(t.name, t.description))
  const filteredUpdates = updates.filter((u) => matchesQuery(u.title, u.description))

  const todoTasks = filteredTasks
    .filter((t) => t.status === 'todo')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  const doneTasks = filteredTasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const sortedUpdates = [...filteredUpdates].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  )

  function handleDragStart(event) {
    const { active } = event
    if (active.data.current?.type === 'update') {
      setActiveDragItem({ type: 'update', data: active.data.current.update })
    } else if (active.data.current?.type === 'task') {
      setActiveDragItem({ type: 'task', data: active.data.current.task })
    } else {
      const task = tasks.find((t) => t.id === active.id)
      if (task) setActiveDragItem({ type: 'task', data: task })
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveDragItem(null)
    if (!over) return

    const targetColumn = over.id // 'updates', 'todo', or 'done'
    const isUpdate = active.data.current?.type === 'update'

    if (isUpdate) {
      const update = active.data.current.update
      if (targetColumn === 'updates') return // same column
      // Moving from updates to todo or done
      setMoveTransition({
        item: update,
        fromColumn: 'updates',
        toColumn: targetColumn,
      })
      return
    }

    const taskId = active.id
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const sourceColumn = task.status // 'todo' or 'done'
    if (sourceColumn === targetColumn) return // same column

    // Moving between todo, done, or updates
    setMoveTransition({
      item: task,
      fromColumn: sourceColumn,
      toColumn: targetColumn,
    })
  }

  function handleDragCancel() {
    setActiveDragItem(null)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stackline</h1>
            <p className="text-sm text-gray-500">Manage your tasks and workflow in one board.</p>
          </div>

          <div className="flex items-center gap-2 w-full max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes or tasks..."
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
          <p className="text-gray-500">Loading...</p>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid grid-cols-3 gap-4">
              <UpdatesColumn
                updates={sortedUpdates}
                onAddClick={() => setShowAddUpdateModal(true)}
                onUpdateClick={setUpdateToView}
                onDeleted={fetchAll}
              />
              <Column
                id="todo"
                title="To Do"
                tasks={todoTasks}
                onTaskClick={setTaskToView}
                onAddClick={() => setShowAddTaskModal(true)}
                addLabel="Add Task"
                onDeleted={fetchAll}
              />
              <Column
                id="done"
                title="Done"
                tasks={doneTasks}
                onTaskClick={setTaskToView}
                onAddClick={() => setShowAddDoneModal(true)}
                addLabel="Add Task"
                onDeleted={fetchAll}
              />
            </div>

            <DragOverlay
              dropAnimation={{
                duration: 250,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}
            >
              {activeDragItem ? (
                <div className="rotate-2 scale-105 transition-transform shadow-2xl rounded-xl cursor-grabbing pointer-events-none w-full max-w-[380px]">
                  {activeDragItem.type === 'update' ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span className="text-xs font-medium text-gray-500">Notes</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">{activeDragItem.data.title}</p>
                      {activeDragItem.data.description && (
                        <p className="text-gray-500 text-xs line-clamp-2">{activeDragItem.data.description}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">
                          {new Date(activeDragItem.data.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </span>
                        <span className="text-[11px] px-2.5 py-1 rounded-md bg-red-50 text-red-600 font-medium">
                          Delete
                        </span>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const isFromNotes = activeDragItem.data.description?.startsWith('[FROM_NOTES]')
                      const displayDesc = isFromNotes
                        ? activeDragItem.data.description.replace(/^\[FROM_NOTES\]/, '')
                        : activeDragItem.data.description
                      const badgeLabel = (activeDragItem.data.status === 'done' && isFromNotes)
                        ? 'From Notes'
                        : activeDragItem.data.status === 'done'
                        ? 'Done'
                        : 'To Do'
                      const badgeColor = (activeDragItem.data.status === 'done' && isFromNotes)
                        ? 'bg-purple-400'
                        : activeDragItem.data.status === 'done'
                        ? 'bg-blue-600'
                        : 'bg-orange-400'

                      return (
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${badgeColor}`} />
                            <span className="text-xs font-medium text-gray-500">
                              {badgeLabel}
                            </span>
                          </div>
                          {activeDragItem.data.image_url && (
                            <img
                              src={activeDragItem.data.image_url}
                              alt={activeDragItem.data.name}
                              className="w-full h-28 object-cover rounded-lg mb-2 pointer-events-none"
                            />
                          )}
                          <p className="font-semibold text-gray-900 text-sm mb-1">{activeDragItem.data.name}</p>
                          {displayDesc && (
                            <p className="text-gray-500 text-xs line-clamp-2">{displayDesc}</p>
                          )}
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">
                              {new Date(activeDragItem.data.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })}
                            </span>
                            <span className="text-[11px] px-2.5 py-1 rounded-md bg-red-50 text-red-600 font-medium">
                              Delete
                            </span>
                          </div>
                        </div>
                      )
                    })()
                  )}
                </div>
              ) : null}
            </DragOverlay>
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
          <GenerateModal
            tasks={tasks}
            updates={updates}
            onClose={() => setShowGenerateModal(false)}
          />
        )}

        {moveTransition && (
          <MoveCardModal
            item={moveTransition.item}
            fromColumn={moveTransition.fromColumn}
            toColumn={moveTransition.toColumn}
            onClose={() => setMoveTransition(null)}
            onMoved={fetchAll}
          />
        )}

        {taskToView && (
          <TaskDetailModal
            task={taskToView}
            onClose={() => setTaskToView(null)}
            onUpdated={fetchAll}
          />
        )}

        {updateToView && (
          <UpdateDetailModal
            update={updateToView}
            onClose={() => setUpdateToView(null)}
            onUpdated={fetchAll}
          />
        )}
      </div>
    </div>
  )
}

export default App