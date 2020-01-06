<template>
  <div >  
    <b-button size="sm" class="mr-1" variant="outline-primary" @click="formatText($event, 'bold')"><b>B</b></b-button>
    <b-button size="sm" class="mr-1" variant="outline-primary" @click="formatText($event, 'italic')"><i>I</i></b></b-button>
    <b-button size="sm" variant="outline-primary" @click="formatText($event, 'strikeThrough')"><s>S</s></b></b-button>
  </div>

</template>

<script>
import Vue from 'vue';
import Common from '../Common.js';

export default 
{
  name: 'Notes_Formatted',
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
    formatText(event, type)
    {
      this.emitFormatText(event, type);
              event.preventDefault();
        event.stopPropagation();       

    },
    emitFormatText(event, type)
    {
      this.$emit('format-text', event, type);
    },
    clickUpDown(event)
    {      
      this.$emit('updown-click', event);
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
