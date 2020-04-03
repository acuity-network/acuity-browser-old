<template>
  <div>
    <span class="arrow mdi mdi-arrow-left mdi-24px" @click="back"></span>
    <span class="arrow mdi mdi-arrow-right mdi-24px" @click="forward"></span>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'navigation',
    methods: {
      back(event: any) {
        this.$router.go(-1)
      },
      forward(event: any) {
        this.$router.go(1)
      }
    },
  }
</script>

<style scoped>
  .arrow {
    cursor: pointer;
    user-select: none;
  }
</style>
