<template>
  <div >
    <span :style="getSectionsLength>0 ? formatIndent : formatNoUpIndent" v-if="showFormatMenu && allowEdit==true" >
      <Notes_Formatter @format-text="formatText" />        
    </span>     
    <span :style="upIndent" v-if="getSectionsLength>0 && allowEdit==true" >
      <Notes_Up @updown-click="openCloseSection" :open="getOpenState" />        
    </span>  
     <span :style="getSectionsLength>0 ? menuIndent :  upIndent" v-if="allowEdit==true">
      <Notes_Menu @flyout-click="selectSection" :sectionId="getId" v-if="allowEdit==true" @set-plain-text="convertToPlainText"/>      
    </span>    
     <span :style="bulletIndent" v-if="allowEdit==true">
      <Notes_Flyout @flyout-click="selectSection" :sectionId="getId" v-if="allowEdit==true"/>      
    </span>
    <div 
      :id="getId"
      ref="section_text"         
      v-html="getSectionText"
      :style="sectionIndent" 
      :contenteditable="true" 
      v-on:keyup="keyMonitor($event)"  
      @keydown.tab.prevent 
      @keyDown.shift.prevent
      v-on:keydown="keyDownMonitor"
      @focus = "focusSection"
      @mouseup="getSelectedText"
      @input="inputText"
      @blur = "blurSection($event, section)"> 
    </div>
   <draggable v-model="getSections" :disabled="isMobile()" @end="dragEnd"   >
    <Notes_Section v-for="(section, index) in getSections" 
      :section="section" 
      :depth="depth+1" 
      :allowEdit=allowEdit
      :haveWritePermissions=haveWritePermissions
      :searchText = 'searchText'
      v-if="(getOpenState) || allowEdit==false" 
      @save-section="emitSaveSection"
      @special-key-pressed="emitKeyPress"
      @section-in-focus="sectionInFocus"
      @section-in-blur="sectionBlurred"
      @special-key-down-pressed="emitKeyDownPress"
      />     
      </draggable>
  </div>
</template>

<script>
import Vue from 'vue'
import Notes_Flyout from '.././components/Notes_Flyout'
import Notes_Up from '.././components/Notes_Up'
import Notes_Menu from '.././components/Notes_Menu';
import Notes_Formatter from '.././components/Notes_Formatter';
import Operations from './Operations.vue';
import Common from '../Common.js';
import { Auth } from 'aws-amplify';
import Sections_Editor from '../components/Sections_Editor.vue';
import draggable from 'vuedraggable';

function getCaretPosition(el)
{
  var caretOffset = 0, sel;
  if (typeof window.getSelection !== "undefined") 
  {
    var range = window.getSelection().getRangeAt(0);
    var selected = range.toString().length;
    var preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(el);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    caretOffset = preCaretRange.toString().length - selected;
  }
  return caretOffset;
}


function SetCaretPositionSpace(el) 
{
  var range = document.createRange();
  var sel = window.getSelection();
  
  var tagText = sel.focusNode.wholeText;
  var tags = tagText.split(" ");

  if (sel.anchorNode.parentNode.className==Common.HashTagTextClass)
  {
    console.log('changing');
    var hashTagText = sel.anchorNode.parentNode;
    var tagContent = sel.anchorNode.parentNode.parentNode;
    var newSpan = document.createElement('span');
    newSpan.className = Common.HashTagTextClass;
    newSpan.innerHTML = tags[0];

    tagContent.replaceChild(newSpan, hashTagText);
    if (tags.length>1)
    {
      tagContent.after(" "+tags[1]);  
    }
    else if (!tagContent.nextSibling)
    {
      // console.log('no tag');
      tagContent.after("\u200B");
      // tagContent.nextSibling.after(" ");
      // console.log('next sibling', tagContent.nextSibling);
      // tagContent.nextSibling.after(" ");
    }
    else
    {
      tagContent.after(" ");
    }

    // var range = document.createRange();
    // var sel = window.getSelection();

    // range.setStart(newSpan, 1);
    range.setStart(tagContent.nextSibling, 1);
    // range.collapse(false);  
    
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();      

    var next = tagContent.nextSibling;
    // tagContent.appendChild(newSpan);
    // parentNode.after("A");
    // parentNode.insertAfter('&nbsp;', el);
  }
}

//From https://stackoverflow.com/questions/512528/set-keyboard-caret-position-in-html-textbox
// function setCaretPosition(elem, caretPos) {
//     var range;

//     if (elem.createTextRange) {
//         range = elem.createTextRange();
//         range.move('character', caretPos);
//         range.select();
//     } else {
//         elem.focus();
//         if (elem.selectionStart !== undefined) {
//             elem.setSelectionRange(caretPos, caretPos);
//         }
//     }
// }

// function setCaretPosition(el, caretPos) 
// {
//   var range = document.createRange();
//   var sel = window.getSelection();
//   range.setStart(el.childNodes[0], caretPos);
//   range.collapse(true);
//   sel.removeAllRanges();
//   sel.addRange(range);
//   el.focus();  

// }

export default 
{
  name: 'Notes_Section',
  props: {
    section:{},
    depth: 0,
    allowEdit: {}, 
    searchText: {},
    haveWritePermissions:false
  },
  components:
  {
    Notes_Flyout,
    Notes_Up,
    Notes_Menu,
    Sections_Editor,
    Notes_Formatter,
    draggable,  
  },
  mounted()
  {
    //JQUERY events to catch tags
    this.setTagClick();
  },
  data: function() 
  {
    return { 
      tagStarted:false,
      poll:null,
      lastKeyDownEvent:null,
      htmlText:'',

      sectionHtml:'', 
      sectionText:'',
      
      sectionLeft: 50,
      upBulletLeft: 10,
      formatBulletLeft:-100,
      archiveBulletLeft: -20,
      bulletLeft: 30,
      menuBulletLeft: 0,

      indentDelta:50,
      lineHeight: '2',
      shiftPressed: false,
      sectionIsDeleted:false,
      selectedRange:{ empty:true},
      selectedNode:{},
      showFormatMenu:false,
      selectedBeginNode:null,
      selectedEndNode:null,

      baseSectionStyle:
      {
        'position':'relative',
        'text-align': 'left',
        'line-height': this.lineHeight,
        'padding-left': '10px',
        'border-left': '1px solid #ccc'
      },
      baseBorderStyle: 
      {
        'border-left': '1px solid #CCC', 
      },
      baseMenuBulletStyle:
      {
        'position':'absolute',
        'display':'block',
        'left': this.menuBulletLeft+'px',
        'line-height': this.lineHeight
      },      
      baseFormatBulletStyle:
      {
        'position':'absolute',
        'display':'block',
        'padding-left': '10px',
        'left': this.formatBulletLeft+'px',
        'line-height': this.lineHeight
      },
      baseUpBulletStyle:
      {
        'position':'absolute',
        'display':'block',
        'padding-left': '10px',
        'left': this.upBulletLeft+'px',
        'line-height': this.lineHeight
      },
      baseBulletStyle:
      {
        // 'float':'left', 
        'position':'absolute',
        'padding-left': '10px',
        'display':'block',
        // 'width':'18px',
        'left': this.bulletLeft+'px',
        'line-height': this.lineHeight 
      },
      archiveBulletStyle:
      {
        // 'float':'left', 
        'position':'absolute',
        'padding-left': '10px',
        'display':'block',
        // 'width':'18px',
        'left': this.archiveBulletLeft+'px',
        'line-height': this.lineHeight         
      }
    }
  },
  computed: 
  {
    getSectionText()
    {
      if (this.allowEdit)
      {
        if (this.inSearchMode() && this.section.searchHtml)
        {
          return this.section.searchHtml;
        }
        else
        {
          return this.section.html;  
        }
      }
      else
      {
        return '-  ' +this.section.text;
      }
    },
    getEditable()
    {
      if (this.haveWritePermissions==false)
      {
        return "false";
      }

      if (this.allowEdit==true)
      {
        return "true";
      }
      else
      {
        return "false";
      }
    },
    getOpenState()
    {
      this.checkIfIncludesSearchText(this.section);  

      if (this.inSearchMode())
      {
        return this.section.includes;         
      }
      else
      {
        if (this.section.open==false)
        {
          return false;
        }
        else
        {
          return true;
        }        
      }
    },
    getId()
    {
      return this.section.id;
    },    
    getSections:
    {
      get() 
      {
          return this.section.sections;
      },
      // need this mutation for fging
      set(sections) 
      {
          this.section.sections = sections;
      }      
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
    },
    sectionIndent()
    {
      this.baseSectionStyle.left=this.sectionLeft+(this.depth*this.indentDelta)+'px';

      if (this.allowEdit==false)
      {
        this.baseSectionStyle['border-left']= '0px';
      }      

      return this.baseSectionStyle;
    },
    menuIndent()
    {
      this.baseMenuBulletStyle.left=this.menuBulletLeft+(this.depth*this.indentDelta)+'px';
      return this.baseMenuBulletStyle;
    },
    archiveIndent()
    {
      this.archiveBulletStyle.left=this.archiveBulletLeft+(this.depth*this.indentDelta)+'px';
      return this.archiveBulletStyle;
    },   
    formatIndent(offset)
    {
      this.baseFormatBulletStyle.left=this.formatBulletLeft+(this.depth*this.indentDelta)+'px';
      return this.baseFormatBulletStyle;
    },     
    formatNoUpIndent()
    {
      var offset=20;
      this.baseFormatBulletStyle.left=(this.formatBulletLeft+offset)+(this.depth*this.indentDelta)+'px';
      return this.baseFormatBulletStyle;
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
  filters: {
  },  
  destroyed()
  {
    this.stopPolling();
  },
  methods:
  {
    inputText()
    { 
      Operations.addPlaceHolderNoOp(this.$store);  //NoOp to stop reload till queue is processed
    },
    checkHighlightedText(event)
    {
      if (!this.selectedRange.empty)
      {
        var clientRectangles = this.selectedRange.getClientRects();
        for(var i = 0 ; i < clientRectangles.length ; i++) {
          if(event.pageX >= clientRectangles[i].left && event.pageX <= clientRectangles[i].right &&
             event.pageY >= clientRectangles[i].top  && event.pageY <= clientRectangles[i].bottom
            ) 
          {
            //show the pop up
            console.log('Show menu');
            break;
          }
        }

      }
    },
    clearSelectedText()
    {
      if (window.getSelection) 
      {
          window.getSelection().removeAllRanges();
      } 
      else if (document.selection) 
      {
          document.selection.empty();
      }
      this.selectedRange = {};
      this.selectedNode = {};
      this.selectedElement={};
      //this.selectedRange.commonAncestorContainer;        
    },
    getSelectedText(event) 
    {
      this.selectedRange = window.getSelection().getRangeAt(0);
      // console.log('getSelectedText',this.selectedRange);

      this.selectedNode = this.selectedRange.commonAncestorContainer;  
      this.selectedBeginNode = this.selectedRange.startContainer;  
      this.selectedEndNode = this.selectedRange.endContainer;  
      this.selectedElement = event.target;   

      this.$emit('selected-text', event, { section: this.section, node: this.selectedNode, range: this.selectedRange });
      if (this.selectedRange.startOffset!=this.selectedRange.endOffset)
      {
        // console.log('showFormatMenu');
        this.showFormatMenu=true;
      }
      else
      {
        this.showFormatMenu=false;
      }
      // console.log('getSelectedText', this.selectedNode, this.selectedRange.startOffset, this.selectedRange.endOffset);
      var el = event.target;
      el.focus();
    },
    selectText(begin, end, startPos, endPos) 
    {
      var range = document.createRange();
      var sel = window.getSelection();
      
      // console.log('SELECT TEXT', node);
      range.setStart(begin, startPos);
      range.setEnd(end, endPos);
      // range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);      
        // Chrome / Firefox
        // console.log('selecttext',el.selectionStart);
        // if (typeof (el.selectionStart) != "undefined") 
        // {
        //     console.log('chrome');
        //     el.focus();
        //     el.selectionStart = startPos;
        //     el.selectionEnd = endPos;
        //     return true;
        // }
        // // IE
        // if (document.selection && document.selection.createRange) {
        // console.log('ie', el);
        //     el.focus();
        //     el.select();
        //     var range = document.selection.createRange();
        //     range.collapse(true);
        //     range.moveEnd("character", endPos);
        //     range.moveStart("character", startPos);
        //     range.select();
        //     return true;
       // }
    },    
    convertToPlainText(event)
    {

      this.$refs.section_text.innerHTML = this.$refs.section_text.innerText;
      this.saveContents(this.$refs.section_text); 
    },
    formatToPlainText(event, type)
    {
     // console.log('formatText',type, this.selectedNode, this.selectedRange.startOffset, this.selectedRange.endOffset);
      this.selectText(this.selectedBeginNode, this.selectedEndNode, this.selectedRange.startOffset, this.selectedRange.endOffset);
      var start = this.selectedRange.startOffset;
      var end = this.selectedRange.endOffset;
      var node = this.selectedNode;

      // var sel = window.getSelection();
      console.log(sel);
//       if (this.selectedRange.startContainer==this.selectedRange.endContainer)
//       {

//       }
//       var text = this.selectedRange.startContainer.textContent.substring(start, end);
// console.log(text);
      // text = this.selectedRange.startContainer.textContent.substring(start, end));  

      document.execCommand('copy' , false , null);
      // console.log(navigator.clipboard.readText());
      // console.log(e.clipboardData.getData('text/plain');


      this.checkAndQueueDeltaChange(this);
      var range = document.createRange();
      var sel = window.getSelection();

      var el = this.$refs.section_text;
      range.collapse(true);      

      sel.removeAllRanges();
      sel.addRange(range);
      
      el.focus(); 


      this.section.html= this.$refs.section_text.innerHTML;
      this.section.text= this.$refs.section_text.innerText;
    },
    formatText(event, type)
    {
      // console.log('formatText',type, this.selectedNode, this.selectedRange.startOffset, this.selectedRange.endOffset);
      this.selectText(this.selectedBeginNode, this.selectedEndNode, this.selectedRange.startOffset, this.selectedRange.endOffset);
      var start = this.selectedRange.startOffset;
      var end = this.selectedRange.endOffset;
      var node = this.selectedNode;

      // event.preventDefault();
      // event.stopPropagation();  
      // this.selectText(this.selectedRange.startOffset, this.selectedRange.endOffset);
      // console.log(node);
      document.execCommand(type , false , null);

      // console.log(this.selectedNode.parentNode);
      // this.startPolling();
      this.checkAndQueueDeltaChange(this);
      var range = document.createRange();
      var sel = window.getSelection();

      var el = this.$refs.section_text;
      // console.log(el.childNodes);
      // for (var i=0; i<el.childNodes.length; i++)
      // {
      //   var child = el.childNodes[i];
      //   console.log(child);
      //   // if (child.className==Common.TagContentClass)
      //   // {
      //   //   range.setStart(el.childNodes[i+1], 1);
      //   //   range.collapse(true);      
      //   // }
      // }

      // range.setStart(this.selectedEndNode, this.selectedRange.endOffset);
      range.collapse(true);      

      sel.removeAllRanges();
      sel.addRange(range);
      
      el.focus(); 

      // console.log(position);

      this.section.html= this.$refs.section_text.innerHTML;
      this.section.text= this.$refs.section_text.innerText;

      // console.log('SELECT TEXT', node);
      // range.setStart(begin, startPos);
      // range.setStart(this.selectedEndNode, this.selectedRange.endOffset);
      // range.setEnd(this.selectedEndNode, this.selectedRange.endOffset);
      // range.collapse(true);
      // sel.removeAllRanges();
      // sel.addRange(range); 
      // this.section.text = target.innerText;
      // this.section.html = target.innerHTML;                

      // var element = this.selectedElement;
      // element.focus();
      // this.clearSelectedText();
      // console.log('formatText After', this.selectedNode,   this.selectedRange.startOffset, this.selectedRange.endOffset);
    },
    highlight (string, query) 
    {
      if (query !== '') 
      {
        let check = new RegExp(query, "ig");
        return string.replace(check, function (matchedText, a, b) 
        {
          return (' <strong class="highlightText">' + matchedText + '</strong>');
        });
      } 
      else 
      {        
        return string;
      }  
    },    
    startPolling() 
    {
      const self = this;
      if (!this.poll)
      {
        this.checkAndQueueDeltaChange(this);

        this.poll = setInterval(function() 
        {
          self.checkAndQueueDeltaChange(self);
        }, Common.DefaultTextChangePollingInMS);        
      }
    }, 
    inSearchMode()
    {
      return (this.searchText!="");
    },
    checkAndQueueDeltaChange(self)
    {
      if (self.$refs.section_text==null) //during a move, this section can disappear and reappear in new position
      {
        return;
      }

      if (self.lastKeyDownEvent && self.section.html!=self.lastKeyDownEvent.target.innerHTML) 
      {
        this.textChanged(self.section, self.lastKeyDownEvent.target.innerText, self.lastKeyDownEvent.target.innerHTML);
        self.lastKeyDownEvent=null;
      }
      else if (self.$refs.section_text.innerHTML!=self.section.html)
      {
        this.textChanged(self.section, self.$refs.section_text.innerText, self.$refs.section_text.innerHTML);
      }
      return;
    },
    getTags(text, separator)
    {
        var hashtags = text.match(Common.HashTagMatch);

        var tags=[];
        if (hashtags)
        {
          for (var i=0; i<hashtags.length; i++)
          {
            var t = hashtags[i].split(separator).filter(x => x);
            if (t.length>0)
            {
              tags.push(t)
            }
            else
            {
              tags.push(hashtags[i])
            }
          }
        }
        return tags;
    },      
    markTags(element, html, separator) 
    {
      var whiteSpace = "&#8203;"; 

      // console.log('before',html);
      // (?<!y)x
      ///\s#(\S*)/g,
      // let re = new RegExp('(?<!y)x');
      // var re = new RegExp('/\s#(\S*)/g');
      // html = html.replace(/\s#(\S*)/g,
      //   " <span class='" + Common.TagContentClass + "'><span class='" +
      //   Common.HashTagTextClass + "'>#$1</span>" + "<span class='" + Common.TagContentNubClass +  
      //   "'></span></span>"+ whiteSpace
      // );

      // html = html.replace(/\s#(\S*)/g,
      //   " <span class='" + Common.TagContentClass + "'><span class='" +
      //   Common.HashTagTextClass + "'>#$1</span></span>"+ whiteSpace);
      html = html.replace("<br>#", "<br> #");

      // console.log('mid',html);

      html = html.replace(/\s#(\S*)/g,
        " <span class='" + Common.TagContentClass + "'><span class='" +
        Common.HashTagTextClass + "'>#$1</span></span>"+ whiteSpace);

      this.setTagClick();
      // console.log('after',html);
      return html;
    },  
    searchTag(text)
    {
      console.log(text);
    },
    processTags(section, text, html)
    {
      var tags = this.getTags(text, Common.HashTag);
      
      return tags;
    },   
    textChanged(section, text, html)
    {
      if (!this.inSearchMode())
      {
        var tags = this.processTags(section, text, html);
        Operations.textChangeOp(this.$store, section, text, html, tags);  
      }
      else
      {
        console.log('not saving');
      }
      
    },
    stopPolling()
    {
      clearInterval(this.poll);
    },  
    checkIfIncludesSearchText(section)
    {
      var includes=false;
      var foundMatchDownstream=false;

      if (this.searchText)
      {
        for (var i=0; i< section.sections.length; i++)
        {
          var s = section.sections[i];
          // includes= this.includesSearch(section);
          includes = this.checkIfIncludesSearchText(s);  
          if (includes)
          {
            foundMatchDownstream= true;            
          }
          s.includes = includes;            
        } 

        if (foundMatchDownstream)
        {
          // console.log('foundMatchDownstream.',section.text);
          includes=true;
          section.includes = includes;   
        }
        else 
        {
          includes= this.includesSearch(section);
          section.includes = includes;                  
        }
      }
      else
      {
        includes=true;
        section.includes = includes;
      }
      
      return includes;
    },    
    includesSearch(section)
    {
      var includesSearch=false;
      if (this.searchText && section.text)
      {
        includesSearch = section.text.toLowerCase().includes(this.searchText.toLowerCase());    
        section.searchHtml=undefined;

        if (includesSearch)
        {
          section.searchHtml = this.highlight(section.html, this.searchText);
        }    
      }

      return includesSearch;
    },
    openCloseSection(event)
    {
      this.section.open = !this.section.open;
      if (this.haveWritePermissions)
      {
        Operations.openCloseOp(this.$store, this.section, this.section.open);  
      }
    },
    emitSelectedText(event, selection)
    {
      this.$emit('selected-text', event, selection)
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
    resetSearchText()
    {
      this.$store.commit('setSearchText', "");
    },
    startMarking()
    {
      this.tagStarted=true;
    },
    endMarking()
    {
      this.tagStarted=false;
    },    
    keyDownMonitor(event)
    {
      this.resetSearchText();

      if (event.key==" " && this.tagStarted)
      {
        // console.log('keyDownMonitor', 'tagEnded');
        this.endMarking();

        var position = getCaretPosition(event.target);

        event.target.innerHTML = this.markTags(event.target, event.target.innerHTML, '#');        
        Common.SetCaretPositionEndOfTag(event.target, position);

        event.target.innerHTML +=" ";
        Common.SetCaretPositionEndOfTag(event.target, position);
      }
      else if (event.key==" ")
      {
        // event.preventDefault();
        // event.stopPropagation();  

        // event.target.insertAdjacentHTML('beforeend', '&nbsp;');
        // var sel = window.getSelection();

        // if (sel.anchorNode.parentNode.className==Common.HashTagTextClass)
        // {


        // }
        // // this.markTags(event.target, event.target.innerHTML, '#'); 
        Common.sleep(100).then(() => 
        {
          SetCaretPositionSpace(event.target);
        });          
        
        // var position = SetCaretPositionEndOfTag(event.target);

        // event.target.innerHTML +="&nbsp;";
        // Common.SetCaretPositionEndOfTag(event.target, position);
      }
      else if (event.key=="#" )
      {        
        this.startMarking();
      }
      else if (event.key=="Shift" )
      {        
        this.shiftPressed = true;
      }
      else if (this.shiftPressed!=true && event.key=="Tab")
      {
        //moving this section, so save the text first
        this.saveContents(event.target);  
        this.emitKeyDownPress(event, 'tab', this.section);
      }
      else if (this.shiftPressed && event.key=="Tab")
      {
        //moving this section, so save the text first
        this.saveContents(event.target);
        this.emitKeyDownPress(event, 'shift_tab', this.section);
      }
      else if (this.shiftPressed && event.key=="Enter")
      {
        this.emitKeyDownPress(event, 'shift_enter', this.section);
      }      
      else if (!this.shiftPressed && event.key=="Enter")
      {
        if (event) event.preventDefault();
        if (event) event.stopPropagation();  
      }
      else if (event.key=="Backspace")
      {
        var src = event.target.innerText
        if (src.trim()=="")
        {
          this.sectionIsDeleted=true;
          this.emitKeyDownPress(event, 'backspace-blank-section', this.section);
        }
      }  
    },    
    keyMonitor(event) 
    {  
      this.lastKeyDownEvent = event;
      this.startPolling();      
      if (event.key=="Enter" && !this.shiftPressed)
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
      this.stopPolling();
      self.lastKeyDownEvent=null;
      if (event.target.id==this.section.id)
      {
        if (this.sectionIsDeleted==false)
        {
          this.saveContents(event.target);  
          this.$emit('section-in-blur', event, this.section, this.depth);
        }
      }
    },
    setSectionHTML(target)
    {
      this.section.text = target.innerText;
      this.section.html = target.innerHTML;
    },
    saveContents(target)
    {
      if (!this.inSearchMode())
      {
        this.checkAndQueueDeltaChange(this);
        this.setSectionHTML(target);
        this.section.html = this.markTags(target, this.section.html, '#');
        this.$emit('save-section');   

        return true;
      }
      else
      {
        return false;
      }
    },
    focusSection() //when the section is focused, emit an event
    {
      this.$emit('section-in-focus', event, this.section, this.depth)
    },
    sectionInFocus(event, section, depth) //when a focus signal is received, pass it up the chain
    {
      //percolate a section in focus up the parents
      this.$emit('section-in-focus', event, section, depth);
    },
    sectionBlurred(event, section, depth)//when a blur signal is received, pass it up the chain
    {
      this.$emit('section-in-blur', event, section, depth)
    },    
    selectSection(event)
    {      
      this.$emit('section-selected', event, this.getId);
    },   
    markIncludesSearch(event, includes, section)
    {
      section.includes = includes;
    },   
    setTagClick()
    {
      //JQUERY events to catch tags
      var tagContent = "."+Common.TagContentClass;
      var self = this;   
       
      $(tagContent).on("click", function(event)
      {
        event.stopPropagation();
        event.stopImmediatePropagation();           
        self.$router.push({ name: 'notesbysearch', params: { query: $(this).text() }})
        self.$store.commit('setSearchText', ($(this).text()).trim());
      });      
    },
    getDraggedSection(event)
    {
      return (this.section.sections[event.newIndex]);
    },  
    dragEnd(event)
    {
      var draggedSection = this.getDraggedSection(event);
      var parentSection = this.section; 

      Operations.dragSectionOp(this.$store, 
        draggedSection, 
        parentSection, 
        parentSection, 
        event.newIndex);
    },    
    isMobile()
    {
      return Common.isMobile();
    }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>


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

.tagContent
{
  overflow-wrap: break-word;
  position: relative;
  user-select: text;
}

.hashTagText {
    color: grey;
    font-size: 0.9em;
    cursor: pointer;
}

.hashTagText:hover {
  background-color: yellow;
}

.highlightText {
    background: yellow;
}
</style>
