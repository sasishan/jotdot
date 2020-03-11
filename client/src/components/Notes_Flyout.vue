<template>
  <div >
  <font-awesome-icon :style="getStyle" :size="getSize" :icon="getIcon" v-on:click="clickFlyout" @mouseover="hover = true" @mouseleave="hover = false"/>
  </div>
</template>

<script>
import Vue from 'vue';
import Common from '../Common.js';

export default 
{
  name: 'Notes_Flyout',
  props: {
    text: String,
    sectionId: String,
    section: {}
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
        return {'color':'#000', 'cursor': 'pointer'};
      }
    },    
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
      Common.GoToSection(this.section.documentId, this.section.id, this.$router, this.$store.state.signedIn);
      // this.$router.push({name:'sectionsById', params:{sectionId: this.sectionId}});
    }     
  }
}

</script>

<style scoped>


</style>
