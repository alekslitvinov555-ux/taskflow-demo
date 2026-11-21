import { defineStore } from 'pinia'
import initialTasks from '../data/tasks.js'
import { useProjectsStore } from './projects.js'

const allowedStatuses = ['todo', 'progress', 'done']
const allowedPriorities = ['low', 'medium', 'high']
const priorityOrder = { high: 0, medium: 1, low: 2 }
const statusOrder = { progress: 0, todo: 1, done: 2 }

function compareDates(a, b, direction) {
  if (!a.dueDate) return b.dueDate ? 1 : 0
  if (!b.dueDate) return -1
  return direction * a.dueDate.localeCompare(b.dueDate)
}

const sortTasks = {
  newest: (a, b) => b.id - a.id,
  title: (a, b) => a.title.localeCompare(b.title, 'uk-UA', { sensitivity: 'base' }),
  priority: (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  dueDate: (a, b) => compareDates(a, b, 1),
  dueDateDesc: (a, b) => compareDates(a, b, -1),
  status: (a, b) => statusOrder[a.status] - statusOrder[b.status],
}

function defaultFilters() {
  return {
    searchText: '',
    selectedStatus: 'all',
    selectedPriority: 'all',
    selectedProject: 'all',
    sortOrder: 'newest',
    incompleteOnly: false,
    onlyWithoutDueDate: false,
  }
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value
}

function normalizeTaskData(data) {
  if (!data || typeof data !== 'object') return null

  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const description = typeof data.description === 'string'
    ? data.description.trim()
    : ''

  if (title.length < 3 || title.length > 80) return null
  if (description.length > 500) return null
  if (!allowedStatuses.includes(data.status)) return null
  if (!allowedPriorities.includes(data.priority)) return null
  const dueDate = data.dueDate ?? ''
  if (dueDate !== '' && !validDate(dueDate)) return null

  const { projects } = useProjectsStore()
  const projectId = projects.some((project) => project.id === data.projectId)
    ? data.projectId
    : 'general'

  return {
    title,
    description,
    status: data.status,
    priority: data.priority,
    dueDate,
    projectId,
  }
}

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: initialTasks.map((task) => ({
      ...task,
      projectId: task.projectId ?? 'general',
    })),
    ...defaultFilters(),
  }),

  getters: {
    totalTasks: (state) => state.tasks.length,
    completedTasks: (state) => state.tasks.filter((task) => task.status === 'done').length,
    progressTasks: (state) => state.tasks.filter((task) => task.status === 'progress').length,
    plannedTasks: (state) => state.tasks.filter((task) => task.status === 'todo').length,
    completionPercent() {
      return this.totalTasks ? Math.round(this.completedTasks / this.totalTasks * 100) : 0
    },
    activeTasks: (state) => state.tasks
      .filter((task) => task.status !== 'done')
      .sort(sortTasks.priority)
      .slice(0, 3),
    visibleTasks: (state) => {
      const search = state.searchText.trim().toLocaleLowerCase('uk-UA')
      const result = state.tasks.filter((task) => {
        const matchesText = task.title.toLocaleLowerCase('uk-UA').includes(search)
          || (task.description ?? '').toLocaleLowerCase('uk-UA').includes(search)
        const matchesStatus = state.selectedStatus === 'all' || task.status === state.selectedStatus
        const matchesPriority = state.selectedPriority === 'all' || task.priority === state.selectedPriority
        const matchesProject = state.selectedProject === 'all' || task.projectId === state.selectedProject
        const matchesIncomplete = !state.incompleteOnly || task.status !== 'done'
        const matchesDate = !state.onlyWithoutDueDate || !task.dueDate

        return matchesText && matchesStatus && matchesPriority && matchesProject
          && matchesIncomplete && matchesDate
      })
      const compare = sortTasks[state.sortOrder]
      return result.sort((a, b) => compare(a, b) || sortTasks.newest(a, b))
    },
    visibleCompletionPercent() {
      const tasks = this.visibleTasks
      const completed = tasks.filter((task) => task.status === 'done').length
      return tasks.length ? Math.round(completed / tasks.length * 100) : 0
    },
  },

  actions: {
    addTask(data) {
      const normalized = normalizeTaskData(data)
      if (!normalized) return null

      const nextId = this.tasks.reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1
      const task = { id: nextId, ...normalized }
      this.tasks.push(task)
      return task
    },
    updateTask({ id, ...data }) {
      const task = this.tasks.find((item) => item.id === id)
      const normalized = normalizeTaskData(data)
      if (!task || !normalized) return null

      Object.assign(task, normalized)
      return task
    },
    setTaskStatus({ id, status }) {
      const task = this.tasks.find((item) => item.id === id)
      if (!task || !allowedStatuses.includes(status)) return false

      task.status = status
      return true
    },
    setTaskPriority({ id, priority }) {
      const task = this.tasks.find((item) => item.id === id)
      if (!task || !allowedPriorities.includes(priority)) return false

      task.priority = priority
      return true
    },
    deleteTask(id) {
      const index = this.tasks.findIndex((task) => task.id === id)
      if (index === -1) return false

      this.tasks.splice(index, 1)
      return true
    },
    resetFilters() {
      this.$patch(defaultFilters())
    },
    moveProjectToProgress(projectId) {
      const tasks = this.tasks.filter((task) => (
        task.projectId === projectId && task.status !== 'progress'
      ))
      this.$patch(() => {
        for (const task of tasks) task.status = 'progress'
      })
      return tasks.length
    },
  },
})
