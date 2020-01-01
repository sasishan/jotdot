<template>
  <div >
  <font-awesome-icon :size="getSize" :icon="getIcon" v-on:click="clickFlyout" @mouseover="hover = true" @mouseleave="hover = false"/>
  </div>
</template>

<script>
import Vue from 'vue'

export default 
{
  name: 'Notes_Flyout',
  props: {
    text: String,
    sectionId: String
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
    getIcon()
    {
      if (this.hover)
        {
          return ['fas', 'arrow-circle-right']
        }
        else
        {
          return ['fas', 'circle']
        }
    },
    getSize()
    {
      if (this.hover)
        {
          return 'lg';
        }
        else
        {
          return 'sm';
        }
    }    
  },
  methods:
  {
    clickFlyout:function(event)
    {      
      // this.$emit('flyout-click', event);
      this.$router.push({name:'sectionsById', params:{sectionId: this.sectionId}});
    }     
  }
}

</script>

<style scoped>


</style>
