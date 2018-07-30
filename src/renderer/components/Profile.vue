<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">{{ title }}</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <ul>
            <li><router-link to="/profile/edit">Edit profile</router-link></li>
          </ul>
          <div v-html="image"></div>
          <div>Account type: <span v-html="type"></span></div>
          <div>Bio: <span v-html="bio"></span></div>
          <div>Location: <span v-html="location"></span></div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  import MixItem from './mix_item.js'

  export default {
    name: 'profile',
    components: {},
    data() {
      return {
        title: '',
        bio: '',
        image: '',
        location: '',
        type: '',
      }
    },
    beforeRouteEnter (to, from, next) {
      next(vm => {
        window.activeAccount.call(vm.$accountProfile.methods.getProfile())
        .then(itemId => {
          var item = new MixItem(vm, itemId)

          item.init()
          .then(item => {
            return item.latestRevision().load()
          })
          .then(revision => {
            vm.title = revision.getTitle()
            vm.bio = revision.getBodyText()
            vm.image = revision.getImage()
            var profile = revision.getProfile()
            vm.location = profile.location

            switch (profile.type) {
              case 0:
                vm.type = 'Anon'
                break

              case 1:
                vm.type = 'Person'
                break

              case 2:
                vm.type = 'Project'
                break

              case 3:
                vm.type = 'Organization'
                break

              case 4:
                vm.type = 'Proxy'
                break

              case 5:
                vm.type = 'Parody'
                break

              case 6:
                vm.type = 'Bot'
                break

              case 7:
                vm.type = 'Shill'
                break
            }
          })
        })
        .catch(error => {
          console.log(error)
        })
      })
    },
  }
</script>
