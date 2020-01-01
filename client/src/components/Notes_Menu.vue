<template>
  <div >  
    <font-awesome-icon 
    :icon="getIcon" 
    size="xs" 
    :style="getStyle" 
    @mouseover="hover = true;" 
    @mouseleave="click==false? hover = false : hover = true;"
    @click="click = !click"/>

  <ul v-if="click" class="menu" >
    <li>Archive node</li>
    <li>123</li>
  </ul>

  </div>

</template>

<script>
import Vue from 'vue';

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
      hover:false, 
      click:false
    }
  },
  computed: 
  {
    getStyle()
    {
      if (this.hover)
      {
        return {'color':'#007bff'};
      }
      else
      {
        return {'color':'#fff'};
      }
    },
    getIcon()
    {
      if (this.open)
      {
        return ['fas', 'ellipsis-h']
      }
      else
      {
        return ['fas', 'ellipsis-h']
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
.menu {
    position: absolute;
    background-color: #DAE4F0;
    min-width: 160px;
    border-radius: 5px;
    padding: 5;
    border: 1px grey;
    z-index: 1000;
}

</style>
