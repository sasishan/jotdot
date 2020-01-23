<template>
  <div >  
    <font-awesome-icon 
    :icon="getIcon" 
    size="xs" 
    :style="getStyle" 
    @mouseover="hover = true;" 
    @mouseleave="click==false? hover = false : hover = true;"
    @click="click = !click"/>

    <div v-if="click" class="menu">
      <div @click="" class="menuOption">Share...</div>
      <hr>
      <div @click="" class="menuOption">Copy to New Jot</div>
      <div @click="" class="menuOption">Copy to Clipboard</div>
      <hr>
      <div @click="clickSetToPlainText" class="menuOption">Make Plain text</div>
    </div>

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

hr {
  margin-top: 0.2em;
  margin-bottom: 0.2em;
  margin-left: 5px;
  margin-right: 5px;
  border-style: solid;
  border-color: white;
  color: white;
}

.menu {
    position: absolute;
    background-color: #1976d2;
    min-width: 160px;
    border-radius: 5px;
    padding-top: 4px;
    padding-bottom: 4px;
    border: 1px solid #1976d2;
    z-index: 1000;
}


/* Change the link color on hover */
.menuOption:hover 
{
  background-color: #FFF;
  color: black;
}

.menuOption {
  display: block;
  font-size: 0.8em;
  padding: 2px 10px;
  cursor: pointer;
  color: white;
}

</style>
