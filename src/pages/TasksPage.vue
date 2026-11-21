<script setup>
import { computed, nextTick, ref } from 'vue'
import AppTabbar from '../components/AppTabbar.vue'

import TaskCard from '../components/TaskCard.vue'
import TaskForm from '../components/TaskForm.vue'
import TaskCounter from '../components/TaskCounter.vue'
import TaskListControls from '../components/TaskListControls.vue'
import {
  taskState,
  addTask,
  updateTask,
  deleteTask,
  setTaskStatus,
  setTaskPriority,
} from '../store/tasks.js'
import '../css/task-components.css'
import '../css/task-form.css'
import '../css/task-list.css'

const searchText = ref('')
const selectedStatus = ref('all')
const selectedPriority = ref('all')
const sortOrder = ref('newest')
const incompleteOnly = ref(false)
const formVisible = ref(false)
const editingId = ref(null)
const formAnchor = ref(null)
const feedback = ref('')
const deleteDialog = ref(null)
const pendingDelete = ref(null)
const listHeading = ref(null)

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

const visibleTasks = computed(() => {
  const search = searchText.value.trim().toLocaleLowerCase('uk-UA')
  const result = taskState.tasks.filter((task) => {
    const matchesText = task.title.toLocaleLowerCase('uk-UA').includes(search)
      || (task.description ?? '').toLocaleLowerCase('uk-UA').includes(search)
    const matchesStatus = selectedStatus.value === 'all' || task.status === selectedStatus.value
    const matchesPriority = selectedPriority.value === 'all' || task.priority === selectedPriority.value
    const matchesIncomplete = !incompleteOnly.value || task.status !== 'done'

    return matchesText && matchesStatus && matchesPriority && matchesIncomplete
  })
  const compare = sortTasks[sortOrder.value]
  return result.sort((a, b) => compare(a, b) || sortTasks.newest(a, b))
})

const completionPercent = computed(() => {
  const tasks = visibleTasks.value
  const completed = tasks.filter((task) => task.status === 'done').length
  return tasks.length ? Math.round(completed / tasks.length * 100) : 0
})

const editingTask = computed(() => (
  taskState.tasks.find((task) => task.id === editingId.value) ?? null
))

function resetFilters() {
  searchText.value = ''
  selectedStatus.value = 'all'
  selectedPriority.value = 'all'
  sortOrder.value = 'newest'
  incompleteOnly.value = false
}

function showAllTasks() {
  resetFilters()
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
    ? updateTask({ id: editingId.value, ...data })
    : addTask(data)

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
  const task = taskState.tasks.find((item) => item.id === id)
  if (!task) return

  pendingDelete.value = task
  await nextTick()
  deleteDialog.value.showModal()
}

async function confirmDelete() {
  const task = pendingDelete.value
  deleteDialog.value.close()
  if (!task || !deleteTask(task.id)) return

  if (editingId.value === task.id) cancelForm()
  feedback.value = `Завдання «${task.title}» видалено.`
  await nextTick()
  listHeading.value?.focus({ preventScroll: true })
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />
    <div class="tf3-container">
      <section class="tf3-hero tf5-header">
        <h1>Керування завданнями</h1>
        <button type="button" class="tf4-new-task" @click="createTask">
          + Додати завдання
        </button>
      </section>

      <p v-if="feedback" class="tf4-feedback" role="status">{{ feedback }}</p>

      <section v-if="formVisible" ref="formAnchor" class="tf4-form-section">
        <TaskForm :key="editingId ?? 'new'" :task="editingTask"
          @save="saveTask" @cancel="cancelForm" />
      </section>

      <TaskListControls v-model:search="searchText" v-model:status="selectedStatus"
        v-model:priority="selectedPriority" v-model:sort="sortOrder"
        v-model:incomplete="incompleteOnly" @reset="resetFilters" />

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <h2 ref="listHeading" tabindex="-1">Список завдань</h2>
          <div class="tf5-summary">
            <TaskCounter :count="visibleTasks.length" :total="taskState.tasks.length" />
            <span class="tf3-counter">Виконано: {{ completionPercent }}%</span>
          </div>
        </div>
        <div v-if="visibleTasks.length" class="tf3-task-grid">
          <TaskCard v-for="task in visibleTasks" :key="task.id"
            :task="task" :editable="true"
            @status-change="setTaskStatus"
            @priority-change="setTaskPriority"
            @edit="editTask" @delete="askDelete" />
        </div>
        <div v-else-if="!taskState.tasks.length" class="tf3-empty">
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
    </div>
    <template #fixed><AppTabbar active="tasks" /></template>
  </f7-page>
</template>
