<template>
  <div>
  <b-link @click="clickHome">
    All Jots 
  </b-link> 
   > 
  <b-link @click="clickTitle" >
    {{ jot.title  }}
  </b-link> 
  <span v-for="(section, index) in sectionsStack.slice().reverse()"> 
    > 
    <b-link @click="clickSection(section.id)">{{section.text}}</b-link>
  </span>
  </div>
</template>

<script>
import Common from '../Common.js';
export default 
{
  name: 'Notes_Breadcrumb',
  props: {
    sectionsStack:{},
    allowEdit:{},
    jot: {}, 
  },
  computed: {
    isSignedIn()
    {
      return this.$store.state.signedIn;
    }
  },  
  methods: 
  {
    clickHome()
    {      
      Common.GoToJots(this.$router, this.$store.state.signedIn);
    },
    clickTitle()
    {
      Common.GoToJotById(this.jot.documentId, this.$router, this.$store.state.signedIn);
    },
    clickSection(sectionId)
    {
// :to="{ name: 'sectionsById', params: { sectionId: section.id }}"      
      Common.GoToSection(this.jot.documentId, sectionId, this.$router, this.$store.state.signedIn);
    }
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
