<template>
  <div>
  <b-link :to="{ name: 'jots'}" v-if="allowEdit==true">
    All Jots
  </b-link> 
   > 
  <b-link :to="{ name: 'jotsById', params: { jotId: jot.documentId }}" v-if="allowEdit==true">
    {{ jot.title  }}
  </b-link> 
  <span v-if="allowEdit==false">Home</span>
  <span v-for="(section, index) in sectionsStack.slice().reverse()"> 
    > 
    <b-link :to="{ name: 'sectionsById', params: { sectionId: section.id }}" v-if="allowEdit==true">{{section.text}}</b-link>
    <span v-if="allowEdit==false">{{section.text}}</span>
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
