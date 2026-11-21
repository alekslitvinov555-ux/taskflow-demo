import { defineStore } from 'pinia'
import { useTasksStore } from './tasks.js'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [
      { id: 'general', title: 'Загальні' },
      { id: 'study', title: 'Навчання' },
      { id: 'personal', title: 'Особисті' },
    ],
    nextProjectId: 1,
  }),

  getters: {
    projectCount: (state) => state.projects.length,
    projectTitle: (state) => (id) => (
      state.projects.find((project) => project.id === id)?.title ?? 'Загальні'
    ),
    projectStats: (state) => {
      const { tasks } = useTasksStore()
      return state.projects.map((project) => {
        const items = tasks.filter((task) => task.projectId === project.id)
        const total = items.length
        const completed = items.filter((task) => task.status === 'done').length
        return {
          ...project,
          total,
          pending: total - completed,
          completedPercent: total ? Math.round(completed / total * 100) : 0,
        }
      })
    },
  },

  actions: {
    addProject(rawTitle) {
      if (typeof rawTitle !== 'string') return null
      const title = rawTitle.trim()
      if (title.length < 3 || title.length > 40) return null

      const lowercase = title.toLocaleLowerCase('uk-UA')
      if (this.projects.some((project) => project.title.toLocaleLowerCase('uk-UA') === lowercase)) {
        return null
      }

      const project = { id: `project-${this.nextProjectId}`, title }
      this.nextProjectId += 1
      this.projects.push(project)
      return project
    },
  },
})
