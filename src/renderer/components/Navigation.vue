<template>
  <div>
    <span class="arrow mdi mdi-arrow-left mdi-36px" v-on:click="back"></span>
    <span class="arrow mdi mdi-arrow-right mdi-36px" v-on:click="forward"></span>
  </div>
</template>

<script>
  export default {
    name: 'navigation',
    methods: {
      back(event) {
        this.$router.go(-1)
      },
      forward(event) {
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
