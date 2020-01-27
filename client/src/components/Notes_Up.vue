<template>
  <div @mouseover="hover = true" @mouseleave="hover = false">  
    <font-awesome-icon :icon="getIcon" :style="getStyle" v-on:click="clickUpDown"/>
  </div>
</template>

<script>
import Vue from 'vue'

export default 
{
  name: 'Notes_Up',
  props: {
    open: true
  },
  data: function() 
  {
    return { 
      showMenu:true,
      hover:false
    }
  },
  computed: 
  {
    getStyle()
    {
      if (this.hover)
      {
        return {'color':'#000', 'cursor': 'pointer'};
      }
      else
      {
        return {'color':'#CCC', 'cursor': 'pointer'};
      }
    },
    getIcon()
    {
      if (this.open)
      {
        return ['fas', 'angle-up']
      }
      else
      {
        return ['fas', 'angle-down']
      }
    }
  },
  methods:
  {
    clickUpDown(event)
    {      
      this.$emit('updown-click', event);
      // this.$router.push('/notes/'+ this.sectionId);
    }     
  }
}

</script>

<style scoped>


</style>
