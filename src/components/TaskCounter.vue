<script setup>
defineProps({
  count: { type: Number, required: true },
  total: { type: Number, required: true },
})
</script>

<template>
  <span class="tf3-counter" role="status">Показано: {{ count }} із {{ total }}</span>
</template>
