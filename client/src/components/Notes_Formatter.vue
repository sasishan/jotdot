<template>
  <div >  
    <!--b-button size="sm" class="mr-1" variant="outline-primary" @click="formatPlainText($event)">P</b-button-->
    <!--b-button size="sm" class="mr-1" variant="outline-primary" @click="undoEvent($event)" :disabled="undoLength==0"><</b-button-->    
    <b-button size="sm" class="mr-1" variant="outline-primary" @click="formatText($event, 'bold')" :disabled="!showFormatting"><b>B</b></b-button>
    <b-button size="sm" class="mr-1" variant="outline-primary" @click="formatText($event, 'italic')" :disabled="!showFormatting"><i>I</i></b></b-button>
    <b-button size="sm" variant="outline-primary" @click="formatText($event, 'strikeThrough')" :disabled="!showFormatting"><s>S</s></b></b-button>
  </div>

</template>

<script>
import Vue from 'vue';
import Common from '../Common.js';

export default 
{
  name: 'Notes_Formatter',
  props: {
    open: true, 
    section: {},
    undoLength:0,
    showFormatting:false
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
    startFormatting()
    {
      this.$store.commit('setFormattingStarted', this.section.id);
    },
    undoEvent()
    {
      this.$emit('undoLast', event);
    },
    formatPlainText(event)
    {
      this.startFormatting();
      this.$emit('format-plain-text', event);
      event.preventDefault();
      event.stopPropagation();       

    },
    formatText(event, type)
    {
      this.startFormatting();
      this.emitFormatText(event, type);
      event.preventDefault();
      event.stopPropagation();       

    },
    emitFormatText(event, type)
    {
      this.startFormatting();
      this.$emit('format-text', event, type);
    },     
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
