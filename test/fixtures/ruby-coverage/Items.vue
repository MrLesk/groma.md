<script setup>
async function load() {
  return fetch('/api/items')
}
async function guarded() {
  await fetch('/external/items')
  return fetch('/private/items')
}
async function unresolved(url) {
  return fetch(url)
}
</script>
<template>
  <button v-if="true" key="action" @click="load">Load</button>
  <button v-else key="action">Wait</button>
</template>
