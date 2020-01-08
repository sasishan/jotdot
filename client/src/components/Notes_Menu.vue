<template>
  <div >  
    <font-awesome-icon 
    :icon="getIcon" 
    size="xs" 
    :style="getStyle" 
    @mouseover="hover = true;" 
    @mouseleave="click==false? hover = false : hover = true;"
    @click="click = !click"/>

    <ul v-if="click" class="menu " >
      <div @click="clickSetToPlainText" class="menuOption">Make Plain text</div>
      <div>Archive</div>
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
    clickSetToPlainText(event)
    {      
      this.$emit('set-plain-text', event);
    }     
  }
}

</script>

<style scoped>
.menuOption
{
  cursor: pointer;
}

.menuOption:hover
{
  color: blue;
}

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
