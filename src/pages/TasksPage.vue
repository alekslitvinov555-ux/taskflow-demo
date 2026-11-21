<script setup>
import { computed, nextTick, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AppTabbar from '../components/AppTabbar.vue'

import TaskCard from '../components/TaskCard.vue'
import TaskForm from '../components/TaskForm.vue'
import TaskCounter from '../components/TaskCounter.vue'
import TaskListControls from '../components/TaskListControls.vue'
import { useTasksStore } from '../store/tasks.js'
import { useProjectsStore } from '../store/projects.js'
import '../css/task-components.css'
import '../css/task-form.css'
import '../css/task-list.css'

const taskStore = useTasksStore()
const projectStore = useProjectsStore()
const {
  tasks, visibleTasks, totalTasks, visibleCompletionPercent, searchText,
  selectedStatus, selectedPriority, selectedProject, sortOrder, incompleteOnly, onlyWithoutDueDate,
} = storeToRefs(taskStore)
const { projects, projectStats } = storeToRefs(projectStore)

const newProjectTitle = ref('')
const newProjectError = ref('')
const formVisible = ref(false)
const editingId = ref(null)
const formAnchor = ref(null)
const feedback = ref('')
const deleteDialog = ref(null)
const pendingDelete = ref(null)
const projectDialog = ref(null)
const pendingProject = ref(null)
const listHeading = ref(null)

const editingTask = computed(() => (
  tasks.value.find((task) => task.id === editingId.value) ?? null
))
const currentProject = computed(() => (
  projectStats.value.find((project) => project.id === selectedProject.value) ?? null
))

function createProject() {
  const project = projectStore.addProject(newProjectTitle.value)
  newProjectError.value = ''
  if (!project) {
    newProjectError.value = 'Введіть унікальну назву від 3 до 40 символів.'
    return
  }

  newProjectTitle.value = ''
  if (!formVisible.value) selectedProject.value = project.id
  feedback.value = `Проєкт «${project.title}» створено.`
}

function showAllTasks() {
  taskStore.resetFilters()
  listHeading.value?.focus()
}

async function scrollToForm() {
  await nextTick()
  formAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function createTask() {
  editingId.value = null
  formVisible.value = true
  feedback.value = ''
  await scrollToForm()
}

async function editTask(id) {
  editingId.value = id
  formVisible.value = true
  feedback.value = ''
  await scrollToForm()
}

function cancelForm() {
  formVisible.value = false
  editingId.value = null
}

function saveTask(data) {
  const isEditing = editingId.value !== null
  const saved = isEditing
    ? taskStore.updateTask({ id: editingId.value, ...data })
    : taskStore.addTask(data)

  if (!saved) {
    feedback.value = 'Не вдалося зберегти завдання. Перевірте дані форми.'
    return
  }

  feedback.value = isEditing
    ? `Завдання «${saved.title}» оновлено.`
    : `Завдання «${saved.title}» створено.`
  cancelForm()
}

async function askDelete(id) {
  const task = tasks.value.find((item) => item.id === id)
  if (!task) return

  pendingDelete.value = task
  await nextTick()
  deleteDialog.value.showModal()
}

async function confirmDelete() {
  const task = pendingDelete.value
  deleteDialog.value.close()
  if (!task || !taskStore.deleteTask(task.id)) return

  if (editingId.value === task.id) cancelForm()
  feedback.value = `Завдання «${task.title}» видалено.`
  await nextTick()
  listHeading.value?.focus({ preventScroll: true })
}

async function askMoveProject() {
  pendingProject.value = currentProject.value
  await nextTick()
  projectDialog.value.showModal()
}

function confirmMoveProject() {
  const project = pendingProject.value
  projectDialog.value.close()
  if (!project) return

  const count = taskStore.moveProjectToProgress(project.id)
  feedback.value = `Проєкт «${project.title}». Завдань переведено в роботу: ${count}.`
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />
    <div class="tf3-container">
      <section class="tf3-hero tf5-header">
        <h1>Керування завданнями й проєктами</h1>
        <button type="button" class="tf4-new-task" @click="createTask">
          + Додати завдання
        </button>
      </section>

      <p v-if="feedback" class="tf4-feedback" role="status">{{ feedback }}</p>

      <section class="tf5-panel" aria-labelledby="tf6-projects-title">
        <h2 id="tf6-projects-title">Мої проєкти</h2>
        <ul class="tf6-projects">
          <li v-for="project in projectStats" :key="project.id" class="tf6-project">
            <strong>{{ project.title }}</strong>
            <span>Завдань: {{ project.total }}</span>
          </li>
        </ul>
        <form class="tf6-project-form" @submit.prevent="createProject">
          <label>
            Назва нового проєкту
            <input v-model.trim="newProjectTitle" type="text" maxlength="40"
              placeholder="Наприклад, Лабораторні" :aria-invalid="!!newProjectError"
              :aria-describedby="newProjectError ? 'tf6-new-project-error' : undefined"
              @input="newProjectError = ''" />
          </label>
          <button type="submit" class="tf3-action tf3-action--primary">Створити проєкт</button>
        </form>
        <p v-if="newProjectError" id="tf6-new-project-error" class="tf4-error" role="alert">
          {{ newProjectError }}
        </p>
      </section>

      <section v-if="formVisible" ref="formAnchor" class="tf4-form-section">
        <TaskForm :key="editingId ?? 'new'" :task="editingTask" :projects="projects"
          :default-project-id="currentProject?.id ?? 'general'"
          @save="saveTask" @cancel="cancelForm" />
      </section>

      <TaskListControls v-model:search="searchText" v-model:status="selectedStatus"
        v-model:priority="selectedPriority" v-model:sort="sortOrder"
        v-model:project="selectedProject" v-model:incomplete="incompleteOnly"
        v-model:only-without-due-date="onlyWithoutDueDate" :projects="projects"
        @reset="taskStore.resetFilters" />

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <h2 ref="listHeading" tabindex="-1">Список завдань</h2>
          <div class="tf5-summary">
            <TaskCounter :count="visibleTasks.length" :total="totalTasks" />
            <span class="tf3-counter">Виконано: {{ visibleCompletionPercent }}%</span>
          </div>
        </div>
        <div v-if="currentProject?.total" class="tf6-project-actions">
          <button type="button" class="tf3-action" @click="askMoveProject">
            Перевести весь проєкт у роботу
          </button>
        </div>
        <div v-if="visibleTasks.length" class="tf3-task-grid">
          <TaskCard v-for="task in visibleTasks" :key="task.id"
            :task="task" :editable="true" :project-title="projectStore.projectTitle(task.projectId)"
            @status-change="taskStore.setTaskStatus"
            @priority-change="taskStore.setTaskPriority"
            @edit="editTask" @delete="askDelete" />
        </div>
        <div v-else-if="!totalTasks" class="tf3-empty">
          Список порожній. Скористайтеся кнопкою «Додати завдання», щоб створити запис.
        </div>
        <div v-else class="tf3-empty">
          <p>За поточними умовами завдань не знайдено.</p>
          <button type="button" class="tf3-action" @click="showAllTasks">
            Показати всі завдання
          </button>
        </div>
      </section>

      <dialog ref="deleteDialog" class="tf5-dialog" aria-labelledby="tf5-delete-title"
        aria-describedby="tf5-delete-description" @close="pendingDelete = null">
        <h2 id="tf5-delete-title">Видалити завдання?</h2>
        <p id="tf5-delete-description">«{{ pendingDelete?.title }}» буде видалено зі списку.</p>
        <div class="tf5-options">
          <button type="button" class="tf3-action" autofocus
            @click="deleteDialog.close()">Скасувати</button>
          <button type="button" class="tf3-action tf5-danger"
            @click="confirmDelete">Видалити</button>
        </div>
      </dialog>
      <dialog ref="projectDialog" class="tf5-dialog" aria-labelledby="tf6-move-title"
        aria-describedby="tf6-move-description" @close="pendingProject = null">
        <h2 id="tf6-move-title">Перевести проєкт у роботу?</h2>
        <p id="tf6-move-description">
          Усі завдання проєкту «{{ pendingProject?.title }}» отримають статус «У роботі».
        </p>
        <div class="tf5-options">
          <button type="button" class="tf3-action" autofocus
            @click="projectDialog.close()">Скасувати</button>
          <button type="button" class="tf3-action tf3-action--primary"
            @click="confirmMoveProject">Перевести в роботу</button>
        </div>
      </dialog>
    </div>
    <template #fixed><AppTabbar active="tasks" /></template>
  </f7-page>
</template>
