<script setup>
import { ref } from 'vue'

defineProps({
  search: { type: String, default: '' },
  status: { type: String, default: 'all' },
  priority: { type: String, default: 'all' },
  project: { type: String, default: 'all' },
  projects: { type: Array, required: true },
  sort: { type: String, default: 'newest' },
  incomplete: { type: Boolean, default: false },
  onlyWithoutDueDate: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:search',
  'update:status',
  'update:priority',
  'update:project',
  'update:sort',
  'update:incomplete',
  'update:onlyWithoutDueDate',
  'reset',
])

const searchInput = ref(null)

function clearSearch() {
  emit('update:search', '')
  searchInput.value?.focus()
}
</script>

<template>
  <section class="tf5-panel" aria-labelledby="tf5-controls-title">
    <h2 id="tf5-controls-title">Пошук і впорядкування</h2>
    <div class="tf5-controls-grid">
      <label class="tf5-search">
        Пошук за назвою та описом
        <input ref="searchInput" type="search" :value="search" placeholder="Наприклад, інтерфейс"
          @input="emit('update:search', $event.target.value)" />
      </label>

      <label>
        Статус
        <select :value="status" @change="emit('update:status', $event.target.value)">
          <option value="all">Усі статуси</option>
          <option value="todo">Заплановано</option>
          <option value="progress">У роботі</option>
          <option value="done">Виконано</option>
        </select>
      </label>

      <label>
        Пріоритет
        <select :value="priority" @change="emit('update:priority', $event.target.value)">
          <option value="all">Усі пріоритети</option>
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
      </label>

      <label>
        Проєкт
        <select :value="project" @change="emit('update:project', $event.target.value)">
          <option value="all">Усі проєкти</option>
          <option v-for="item in projects" :key="item.id" :value="item.id">{{ item.title }}</option>
        </select>
      </label>

      <label>
        Сортування
        <select :value="sort" @change="emit('update:sort', $event.target.value)">
          <option value="newest">Спочатку нові</option>
          <option value="title">За назвою (А–Я)</option>
          <option value="priority">За пріоритетом (високі першими)</option>
          <option value="dueDate">За терміном (найближчі першими)</option>
          <option value="dueDateDesc">За терміном (найпізніші першими)</option>
          <option value="status">За статусом</option>
        </select>
      </label>
    </div>

    <div class="tf5-options">
      <label class="tf5-incomplete">
        <input type="checkbox" :checked="incomplete"
          @change="emit('update:incomplete', $event.target.checked)" />
        Тільки невиконані
      </label>
      <label class="tf5-incomplete">
        <input type="checkbox" :checked="onlyWithoutDueDate"
          @change="emit('update:onlyWithoutDueDate', $event.target.checked)" />
        Лише без терміну
      </label>
      <button v-if="search" type="button" class="tf3-action"
        @click="clearSearch">Очистити пошук</button>
      <button type="button" class="tf3-action" @click="emit('reset')">Скинути фільтри</button>
    </div>
  </section>
</template>
