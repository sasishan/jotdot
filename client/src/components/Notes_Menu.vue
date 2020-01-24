<template>
  <div >  
    <font-awesome-icon 
    :icon="getIcon" 
    size="xs" 
    :style="getStyle" 
    @mouseover="hover = true;" 
    @mouseleave="showSectionMenu==false ? hover = false : hover = true;"
    @click="emitClick"
    />

    <div v-if="showSectionMenu" class="menu">
      <div @click="" class="menuOption">Share...</div>
      <hr>
      <div @click="" class="menuOption">Copy to New Jot</div>
      <div @click="" class="menuOption">Copy to Clipboard</div>
      <hr>
      <div @click="clickSetToPlainText" class="menuOption">Make Plain text</div>
      <div @click="clickUndo" :class="undoLength>0 ? 'menuOption' : 'menuOptionDisabled'">Undo Last</div>
    </div>

  </div>

</template>

<script>
import Vue from 'vue';

export default 
{
  name: 'Notes_Menu',
  props: {
    undoLength:0,
    showSectionMenu: false
  },
  data: function() 
  {
    return { 
      showMenu:true,
      hover:false, 
      click:false,
      open:false      
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
      if (!this.showSectionMenu)
      {
        return ['fas', 'ellipsis-h']
      }
      else
      {
        return ['fas', 'times']
      }
    }
  },
  methods:
  {
    emitClick(event)
    {
      this.$emit('click-section', event);
    },
    clickSetToPlainText(event)
    {      
      this.$emit('set-plain-text', event);
    },
    clickUndo()
    {
      this.$emit('undoLast', event);
    },
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
    min-width: 140px;
    border-radius: 5px;
    padding-top: 4px;
    padding-bottom: 4px;
    border: 1px solid #1976d2;
    z-index: 1000;
    right: 0;
    left: auto;    
}


/* Change the link color on hover */
.menuOption:hover 
{
  background-color: #FFF;
  color: black;
}

.menuOption, .menuOptionDisabled {
  display: block;
  font-size: 0.8em;
  padding: 2px 10px;
  cursor: pointer;
  color: white;
}

.menuOptionDisabled
{
  color: #BBB;
  cursor: default;
}

</style>
