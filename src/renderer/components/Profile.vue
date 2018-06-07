<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Profile</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <ul>
            <li><router-link to="/profile/edit">Edit profile</router-link></li>
          </ul>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'profile',
    components: {}
  }
</script>
