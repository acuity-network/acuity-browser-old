<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Browsing history</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <b-table :data="data">
            <template slot-scope="props">
              <b-table-column field="when" label="Last access">
                {{ props.row.when }}
              </b-table-column>

              <b-table-column field="item" label="Item">
                <router-link :to="props.row.route">{{ props.row.title }}</router-link>
              </b-table-column>

              <b-table-column field="author" label="Author">
                <router-link :to="props.row.ownerRoute">{{ props.row.owner }}</router-link>
              </b-table-column>

            </template>
          </b-table>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'browsing-history',
    data() {
      return {
        data: [],
        columns: [
          {
            field: 'timestamp',
            sortable: true,
            visible: false,
          },
          {
            field: 'when',
            label: 'Last access',
          },
          {
            field: 'item',
            label: 'Item',
            renderHtml: true,
          },
          {
            field: 'author',
            label: 'Author',
          },
        ],
      }
    },
    created() {
      this.$db.get('/historyCount')
      .then(count => {
        for (var i = count - 1; i >= 0; i--) {
          this.$db.get('/history/' + i)
          .then(json => {
            var item = JSON.parse(json)
            this.data.push({
              timestamp: item.timestamp,
              when: new Date(item.timestamp).toLocaleString(),
              route: '/item/' + item.itemId,
              title: item.title,
              owner: item.owner ? item.owner : '',
              ownerRoute: item.ownerRoute ? item.ownerRoute : '',
            })
          })
          .catch(() => {})
        }
      })
    },
  }
</script>
