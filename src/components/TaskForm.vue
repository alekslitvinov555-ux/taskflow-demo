<script setup>
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  task: { type: Object, default: null },
})
const emit = defineEmits(['save', 'cancel'])

// Копіюємо поля: форма не змінює вихідний об'єкт до натискання «Зберегти».
const form = reactive({
  title: props.task?.title ?? '',
  description: props.task?.description ?? '',
  status: props.task?.status ?? 'todo',
  priority: props.task?.priority ?? 'medium',

  dueDate: props.task?.dueDate ?? '',
})

const showErrors = ref(false)
const isEditing = computed(() => props.task !== null)
const statusLabels = {
  todo: 'Заплановано',
  progress: 'У роботі',
  done: 'Виконано',
}
const priorityLabels = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value
}

const errors = computed(() => {
  const result = {}
  const title = form.title.trim()
  const description = form.description.trim()

  if (!title) result.title = 'Вкажіть назву завдання.'
  else if (title.length < 3) result.title = 'Назва має містити щонайменше 3 символи.'
  else if (title.length > 80) result.title = 'Максимальна довжина — 80 символів.'

  if (description.length > 300) {
    result.description = 'Опис не повинен перевищувати 300 символів.'
  }
  if (!['todo', 'progress', 'done'].includes(form.status)) {
    result.status = 'Оберіть коректний статус.'
  }
  if (!['low', 'medium', 'high'].includes(form.priority)) {
    result.priority = 'Оберіть коректний пріоритет.'
  }
  if (!isValidDate(form.dueDate)) {
    result.dueDate = 'Укажіть коректну дату завершення.'
  }
  return result
})

function clearForm() {
  Object.assign(form, {
    title: '', description: '', status: 'todo', priority: 'medium', dueDate: '',
  })
  showErrors.value = false
}

function submitForm() {
  showErrors.value = true
  if (Object.keys(errors.value).length > 0) return

  emit('save', {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
    priority: form.priority,
    dueDate: form.dueDate,
  })
}
</script>

<template>

  <div class="tf4-form-panel">
    <div class="tf4-form-heading">
      <div>
        <div class="tf3-eyebrow">TASKFLOW / FORM</div>
        <h2>{{ isEditing ? 'Редагування завдання' : 'Нове завдання' }}</h2>
      </div>
      <button type="button" class="tf4-close" @click="emit('cancel')">
        Закрити
      </button>
    </div>

    <form class="tf4-form" novalidate @submit.prevent="submitForm">
      <div class="tf4-field tf4-field--wide">
        <label for="tf4-title">Назва завдання *</label>
        <input id="tf4-title" v-model.trim="form.title" type="text"
          placeholder="Наприклад: Підготувати звіт" maxlength="80"
          :aria-invalid="showErrors && !!errors.title"
          aria-required="true"
          :aria-describedby="showErrors && errors.title ? 'tf4-title-hint tf4-title-error' : 'tf4-title-hint'" />
        <small id="tf4-title-hint">Від 3 до 80 символів. Залишилось: {{ 80 - form.title.length }}</small>
        <p v-if="showErrors && errors.title" id="tf4-title-error" class="tf4-error">
          {{ errors.title }}
        </p>
      </div>

      <div class="tf4-field tf4-field--wide">
        <label for="tf4-description">Опис</label>
        <textarea id="tf4-description" v-model.trim="form.description"
          placeholder="Що потрібно зробити?" rows="3" maxlength="300"
          :aria-invalid="showErrors && !!errors.description"
          :aria-describedby="showErrors && errors.description ? 'tf4-description-hint tf4-description-error' : 'tf4-description-hint'"></textarea>
        <small id="tf4-description-hint">Необов'язкове поле. Залишилось: {{ 300 - form.description.length }}</small>
        <p v-if="showErrors && errors.description" id="tf4-description-error" class="tf4-error">
          {{ errors.description }}
        </p>
      </div>

      <div class="tf4-field">
        <label for="tf4-status">Статус *</label>
        <select id="tf4-status" v-model="form.status" aria-required="true"
          :aria-describedby="showErrors && errors.status ? 'tf4-status-error' : undefined"
          :aria-invalid="showErrors && !!errors.status">
          <option value="todo">Заплановано</option>
          <option value="progress">У роботі</option>
          <option value="done">Виконано</option>
        </select>
        <p v-if="showErrors && errors.status" id="tf4-status-error" class="tf4-error">{{ errors.status }}</p>
      </div>

      <div class="tf4-field">
        <label for="tf4-priority">Пріоритет *</label>
        <select id="tf4-priority" v-model="form.priority" aria-required="true"
          :aria-describedby="showErrors && errors.priority ? 'tf4-priority-error' : undefined"
          :aria-invalid="showErrors && !!errors.priority">
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
        <p v-if="showErrors && errors.priority" id="tf4-priority-error" class="tf4-error">{{ errors.priority }}</p>
      </div>

      <div class="tf4-field tf4-field--wide">
        <label for="tf4-date">Дата завершення *</label>
        <input id="tf4-date" v-model="form.dueDate" type="date"
          :aria-invalid="showErrors && !!errors.dueDate"
          aria-required="true"
          :aria-describedby="showErrors && errors.dueDate ? 'tf4-date-error' : undefined" />

        <p v-if="showErrors && errors.dueDate" id="tf4-date-error" class="tf4-error">
          {{ errors.dueDate }}
        </p>
      </div>

      <div class="tf4-preview tf4-field--wide" aria-live="polite">
        <strong>Попередній перегляд</strong>
        <p>{{ form.title || 'Назва нового завдання' }}</p>
        <span>{{ statusLabels[form.status] }} · {{ priorityLabels[form.priority] }}</span>
      </div>

      <div class="tf4-actions tf4-field--wide">
        <button type="submit" class="tf4-save">
          {{ isEditing ? 'Зберегти зміни' : 'Створити завдання' }}
        </button>
        <button v-if="!isEditing" type="button" class="tf4-clear" @click="clearForm">
          Очистити форму
        </button>
        <button type="button" class="tf4-cancel" @click="emit('cancel')">
          Скасувати
        </button>
      </div>
    </form>
  </div>
</template>
