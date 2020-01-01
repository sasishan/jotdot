<template>
  <div >
    <b-button variant="outline-primary" size="sm" v-on:click="clickAddSection"  >+</b-button>
  </div>
</template>

<script>
import Vue from 'vue'

export default 
{
  name: 'Notes_Add',
  props: {
  },
  data: function() 
  {
    return { 
      showMenu:true
    }
  },
  computed: 
  {
  },
  methods:
  {
    clickAddSection:function(event)
    {      
      this.$emit('add-section-click', event);
      // this.$router.push('/notes/'+ this.sectionId);
    }     
  }
}

</script>

<style scoped>


</style>
