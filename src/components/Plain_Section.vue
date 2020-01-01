<template>
  <div >
    <span :style="bulletIndent">
    - 
    </span>
    <div 
       :id="getId"
        ref="getId" 
        v-text="section.text"
        :style="sectionIndent" 
        contenteditable="true" 
        v-on:keyup="keyMonitor($event)"  
        @keydown.enter.prevent 
        @keydown.tab.prevent 
        @keyDown.shift.prevent
        v-on:keydown="keyDownMonitor"
        @focus = "focusSection"
        @blur = "blurSection($event, section)"                      
        v-focus>
    </div>
    <Notes_Section v-for="(section, index) in getSections" 
      :section="section" 
      :depth="depth+1" 
      v-if="getOpenState" 
      @save-section="emitSaveSection"
      @special-key-pressed="emitKeyPress"
      @section-in-focus="sectionInFocus"
      @section-in-blur="sectionBlurred"
      @special-key-down-pressed="emitKeyDownPress"/>     
  </div>
</template>

<script>
import Vue from 'vue'
import Notes_Flyout from '.././components/Notes_Flyout'
import Notes_Up from '.././components/Notes_Up'
import Notes_Menu from '.././components/Notes_Menu'
import { Auth } from 'aws-amplify';
const axios = require('axios')

export default 
{
  name: 'Notes_Section',
  props: {
    section:{},
    depth: 0
  },
  components:
  {
    Notes_Flyout,
    Notes_Up,
    Notes_Menu
  },
  data: function() 
  {
    return { 
      showMenu:false,
      sectionLeft: 50,
      borderLeft: 0, 
      bulletLeft: 30,
      upBulletLeft: 10,
      menuBulletLeft: -35,
      indentDelta:50,
      lineHeight:2,
      shiftPressed: false,
      baseSectionStyle:
      {
        'position':'relative',
        'text-align': 'left',
        'line-height': '2',
        'padding-left': '10px',
        'border-left': '1px solid #ccc'
        // 'left': this.sectionLeft+'px',
      },
      baseBorderStyle: 
      {
        'border-left': '1px solid #CCC', 
        // 'margin-left': this.sectionLeft+'px',
        // 'padding-left': '10px',
      },
      baseMenuBulletStyle:
      {
        'position':'absolute',
        'display':'block',
        'left': this.menuBulletLeft+'px',
        'line-height': '2'
      },      
      baseUpBulletStyle:
      {
        'position':'absolute',
        'display':'block',
        'padding-left': '10px',
        'left': this.upBulletLeft+'px',
        'line-height': '2'
      },
      baseBulletStyle:
      {
        // 'float':'left', 
        'position':'absolute',
        'padding-left': '10px',
        'display':'block',
        // 'width':'18px',
        'left': this.bulletLeft+'px',
        'line-height': '2' 
      },

    }
  },
  mounted() 
  {
    // this.sectionText = this.text;  
    // console.log('mounted='+this.section.id);
  },   
  computed: 
  {
    getOpenState()
    {
      if (this.section.open==false)
      {
        return false;
      }
      else
      {
        return true;
      }
    },
    getId()
    {
      return this.section.id;
    },    
    getSections()
    {
      return this.section.sections;
    },
    getSectionsLength()
    {
      if (this.section.sections)
      {
        return this.section.sections.length;
      }
      else
      {
        return 0;
      }
    },
    borderIndent()
    {
      return this.baseBorderStyle;
      this.baseBorderStyle['margin-left']=this.borderLeft+(this.depth*this.indentDelta)+'px';
      if (this.depth==0)
      {
        this.baseBorderStyle['margin-left']=-8+'px';
      }
      else if (this.depth==1)
      {
       this.baseBorderStyle['margin-left']=48+'px'; 
      }
      else
      {
       this.baseBorderStyle['margin-left']=50+'px';  
      }
      // console.log('border='+this.depth);
      // console.log(this.borderLeft+(this.depth*this.indentDelta)+'px');
      return this.baseBorderStyle;      
    },
    sectionIndent()
    {
      // this.baseSectionStyle.left= '10px';
      // console.log('section='+this.depth);
      // console.log(this.sectionLeft+(this.depth*this.indentDelta)+'px');
      this.baseSectionStyle.left=this.sectionLeft+(this.depth*this.indentDelta)+'px';
      // if (this.depth==0)
      // {
      //   this.baseSectionStyle.left=this.sectionLeft+(this.depth*this.indentDelta)+'px';
      // }
      // else
      // {
      //   this.baseSectionStyle.left=this.sectionLeft+this.indentDelta+'px';
        // console.log(this.baseSectionStyle.left);
      // }
      return this.baseSectionStyle;
    },
    menuIndent()
    {
      this.baseMenuBulletStyle.left=this.menuBulletLeft+(this.depth*this.indentDelta)+'px';
      return this.baseMenuBulletStyle;
    },
    upIndent()
    {
      this.baseUpBulletStyle.left=this.upBulletLeft+(this.depth*this.indentDelta)+'px';
      return this.baseUpBulletStyle;
    },
    bulletIndent() 
    {
      this.baseBulletStyle.left=this.bulletLeft+(this.depth*this.indentDelta)+'px';
      return this.baseBulletStyle;
    }
  },
  directives: {
    focus: {
      // directive definition
      inserted: function (el) 
      {
        el.focus()
      }
    }
  },  
  methods:
  {
    // emitKeyPress(event, section)
    // {

    // },
    openCloseSection(event)
    {
      this.section.open = !this.section.open;
    },
    emitSaveSection(event)
    {
      this.$emit('save-section', event);
    },
    emitKeyPress(event,section)
    {
      this.$emit('special-key-pressed', event, section)
    },
    emitKeyDownPress(event, eventType, section)
    {
      this.$emit('special-key-down-pressed', event, eventType, section)
    },    
    keyDownMonitor(event)
    {
      if (event.key=="Shift" )
      {
        this.shiftPressed = true;
      }
      else if (this.shiftPressed!=true && event.key=="Tab")
      {
        // console.log('tab')
        this.emitKeyDownPress(event, 'tab', this.section);
      }
      else if (this.shiftPressed && event.key=="Tab")
      {
        this.emitKeyDownPress(event, 'shift_tab', this.section);
      }
      else if (event.key=="Backspace")
      {
        var src = event.target.innerText
        if (src=="")
        {
          this.emitKeyDownPress(event, 'backspace-blank-section', this.section);
        }
      }

      
    },    
    keyMonitor(event) 
    {  
      if (event.key=="Enter" )
      {
        this.emitKeyPress(event, this.section);
      }  
      else if (event.key=="Shift")
      {
        this.shiftPressed=false; 
      }
      else
      {
        this.$emit('content-key-pressed', event)
      }
    }, 
    blurSection(event, section) //when the section is blurred, emit an event and save the changes
    {
      // this.showMenu=false;
      // console.log('blurring event of section '+ this.section.id);
      // console.log(event.target.id);
      if (event.target.id==this.section.id)
      {
        this.saveContents(event.target);
        // console.log('blurring sent section ' + section.id);
        // console.log('blurring section  ' + this.section.text + ' ' + this.section.id);
        this.$emit('section-in-blur', event, this.section, this.depth);

      }

    },
    saveContents(target)
    {
      var src = target.innerText
      this.section.text = src;
      this.$emit('save-section')

    },
    focusSection() //when the section is focused, emit an event
    {
      this.showMenu=true;
      this.$emit('section-in-focus', event, this.section, this.depth)
    },
    sectionInFocus(event, section, depth) //when a focus signal is received, pass it up the chain
    {
      // console.log('in notesection in focus');
      //percolate a section in focus up the parents
      this.$emit('section-in-focus', event, section, depth);
    },
    sectionBlurred(event, section, depth)//when a blur signal is received, pass it up the chain
    {
      // console.log(src);
      // console.log('section blurred');
      this.$emit('section-in-blur', event, section, depth)

    },    
    selectSection(event)
    {      
      console.log('got flyout flyout-click');
      // this.$store.commit('sectionSelected', this.getId);
      this.$emit('section-selected', event, this.getId);
    }     
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>


content {
  border: 0;
}

.hidden
{
  display: none;
}

.bulletSection
{
  float:left
}

.section
{
  border-left:1px solid;
}
.section_content
{
  text-align: left; 
  position: relative;
  padding-right: 70px;
  min-width: 498px;
}

</style>
