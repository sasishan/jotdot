<template>
  <div>
  <b-link :to="{ name: 'jots'}">
    All Jots
  </b-link> 
   > 
  <b-link :to="{ name: 'jotsById', params: { jotId: jot.documentId }}" >
    {{ jot.title  }}
  </b-link> 
  <span v-for="(section, index) in sectionsStack.slice().reverse()"> 
    > 
    <b-link :to="{ name: 'sectionsById', params: { sectionId: section.id }}" >{{section.text}}</b-link>
  </span>
  </div>
</template>

<script>

export default 
{
  name: 'Notes_Breadcrumb',
  props: {
    sectionsStack:{},
    allowEdit:{},
    jot: {}
  },
  computed: {
  },  
  methods: 
  {
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
</style>
