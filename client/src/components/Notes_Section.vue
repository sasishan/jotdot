<template>
  <div >
    <span :style="getSectionsLength>0 ? formatIndent : formatNoUpIndent" v-if="showFormatMenu && allowEdit==true" >
      <Notes_Formatter 
        @format-text="formatText"         
        :section="section" 
        :showFormatting="formattingInProgress"
        :undoLength="getUndo().length"/>             
    </span>     
    <span :style="upIndent" v-if="getSectionsLength>0 && allowEdit==true" >
      <Notes_Up @updown-click="openCloseSection" :open="getOpenState" />        
    </span>  
     <span :style="getSectionsLength>0 ? menuIndent :  upIndent" v-if="allowEdit==true">
      <Notes_Menu 
        @click-section="clickShowSectionMenu"
        :sectionId="getId" 
        :undoLength="getUndo().length"
        v-if="allowEdit==true" 
        @set-plain-text="convertToPlainText"
        @undoLast="undoLast()"
        :showSectionMenu="showSectionMenu"/>      
    </span>    
     <span :style="bulletIndent" v-if="allowEdit==true">
      <Notes_Flyout @flyout-click="selectSection" :section="section" :sectionId="getId" v-if="allowEdit==true"/>      
    </span>
    <!--TipTap 
      :style="sectionIndent" 
      :sectionContent="getSectionContent" /-->
    <div 
      :id="getId"
      ref="section_text"         
      v-html="getSectionContent"
      :style="sectionIndent" 
      :contenteditable="getEditable" 
      v-on:keyup="keyUpMonitor($event)"  
      @keydown.tab.prevent 
      @keyDown.shift.prevent
      v-on:keydown="keyDownMonitor"
      @focus = "focusSection"
      @mouseup="getSelectedText"
      @input="inputText"
      @paste="pasteContent"
      @blur = "blurSection($event, section)"> 
    </div>
   <draggable v-model="getSections" :disabled="isMobile() || !allowEdit" @end="dragEnd" v-bind="dragOptions()">
    <Notes_Section v-for="(section, index) in getSections" 
      :section="section" 
      :depth="depth+1" 
      :allowEdit=allowEdit
      :haveWritePermissions=haveWritePermissions
      :searchText = 'searchText'
      :offset="0"
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
import Sanitizer from '../Sanitizer.js';
import { Auth } from 'aws-amplify';
import Sections_Editor from '../components/Sections_Editor.vue';
import draggable from 'vuedraggable';
import TextFormatter from '../TextFormatter.js';
import { uuid } from 'vue-uuid';
import sanitizeHTML from 'sanitize-html';
import TipTap from '../components/TipTap';

export default 
{
  name: 'Notes_Section',
  props: {
    offset: {},
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
    TipTap 
  },
  mounted()
  {
    // this.initializeSection();
    this.sectionText = this.section.text;
    this.sectionHtml = this.section.html;//

    //JQUERY events to catch tags
    this.setTagClick();
  },
  data: function() 
  {
    return { 
      sectionHtml:{}, 
      sectionText:{},
      tagText:'',
      formattingInProgress:false,

      menuSelected:false,

      lastOffsetY: 0,
      tagStarted:false,
      poll:null,
      lastKeyDownEvent:null,
      htmlText:'',

      sectionLeft: 50,
      upBulletLeft: 10,
      formatBulletLeft:-100,
      archiveBulletLeft: -20,
      bulletLeft: 30,
      menuBulletLeft: 0,

      indentDelta: 40,
      lineHeight: '2',
      shiftPressed: false,
      sectionIsDeleted:false,
      selectedRange:{ empty:true},
      selectedNode:{},
      // showFormatMenu:false,
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
    showSectionMenu()
    {
      // console.log(this.$store.getters.getCurrentOpenSectionMenuId, this.section.id);

      if (this.$store.getters.getCurrentOpenSectionMenuId==this.section.id)
      {
        return true;
      }
      return false;
    },
    showFormatMenu()
    {
      if (this.isFormattingInProgress() && this.$store.getters.getCurrentFocusSectionId==this.section.id)
      {
        return true;
      }
      return false;
    },
    getSectionContent()
    {
      var content="";
      if (this.allowEdit)
      {
        if (this.inSearchMode() && this.section.searchHtml)
        {
          content= this.section.searchHtml; //hacky!
        }
        else
        {
          // console.log('section html', this.sectionHtml);
          if (this.section.html=="")
          {
            content= "</br>"; //for firefox
          }
          else
          {
            content= this.section.html;    
          }
        }
      }
      else
      {
        content= '-  ' +this.section.html; 
      }

      // return content;
      // console.log(sanitized)
      // return this.runSanitizer(content);
      // return content;


      content = 
        this.$sanitize(content, 
        {
          allowedTags: this.$sanitize.defaults.allowedTags.concat([ 'span', 'table', 'a']),
          allowedAttributes:
          {
            'span': ['contenteditable'], 
            'a':['href']
          },
          // allowedAttributes: this.$sanitize.defaults.allowedAttributes.concat([ 'contentEditable']), 
          allowedClasses:{
            'span': [ 'hashTagText' ], 
            'strong': ['highlightText']
          },
        });         
        // this.$sanitize(content, 
        // {
        //   allowedTags: this.$sanitize.defaults.allowedTags.concat([ 'img', 'span', 'table']),
        //   allowedClasses: {
        //     'span': [ 'hashTagText' ]
        //   },
        // });    
        return content;  
    },
    getEditable()
    {
      return this.allowEdit;
    },
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
      this.baseSectionStyle.left=this.offset+this.sectionLeft+(this.depth*this.indentDelta)+'px';

      if (this.allowEdit==false)
      {
        this.baseSectionStyle['border-left']= '0px';
      }      

      return this.baseSectionStyle;
    },
    menuIndent()
    {
      this.baseMenuBulletStyle.left=this.offset+this.menuBulletLeft+(this.depth*this.indentDelta)+'px';
      return this.baseMenuBulletStyle;
    },
    archiveIndent()
    {
      this.archiveBulletStyle.left=this.offset+this.archiveBulletLeft+(this.depth*this.indentDelta)+'px';
      return this.archiveBulletStyle;
    },   
    formatIndent(offset)
    {
      this.baseFormatBulletStyle.left=this.offset+this.formatBulletLeft+(this.depth*this.indentDelta)+'px';
      return this.baseFormatBulletStyle;
    },     
    formatNoUpIndent()
    {
      var offset=20;
      this.baseFormatBulletStyle.left=(this.offset+this.formatBulletLeft+offset)+(this.depth*this.indentDelta)+'px';
      return this.baseFormatBulletStyle;
    },
    upIndent()
    {
      this.baseUpBulletStyle.left=this.offset+this.upBulletLeft+(this.depth*this.indentDelta)+'px';
      return this.baseUpBulletStyle;
    },
    bulletIndent() 
    {
      this.baseBulletStyle.left=this.offset+this.bulletLeft+(this.depth*this.indentDelta)+'px';
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
    // initializeSection()
    // {
    //   // console.log('initializeSection',this.section.id, this.section.text);
    //   this.sectionText = this.section.text;
    //   this.sectionHtml = "BBB";//
    //   console.log('this.section.html', this.section.html);

    //   return true;
    // },
    clickShowSectionMenu(event)
    {
      if (this.$store.getters.getCurrentOpenSectionMenuId==this.section.id)
      {
        this.$store.commit('setCurrentOpenSectionMenuId', null);
      }
      else
      {
        this.$store.commit('setCurrentOpenSectionMenuId', this.section.id);  
      }
      
      // this.menuSelected=true;
    },
    runSanitizer(content)
    {
      var parser = new Sanitizer.HtmlWhitelistedSanitizer(true);
      var sanitizedHtml = Sanitizer.sanitizeString(parser, content);
      // output_as_string.textContent = sanitizedHtml;
      // output_as_node.innerHTML = sanitizedHtml;
      return sanitizedHtml;

    },    
    dragOptions()
    {
      return Common.DragOptions;
    }, 
    pasteContent(event)
    {
      // console.log(event);
      // event.preventDefault();
      // document.execCommand('inserttext', false, event.clipboardData.getData('text/plain'));
      // console.log('pasted: '+ event.clipboardData.getData('text/plain'));
    },  
    inputText(event)
    { 
      Operations.addPlaceHolderNoOp(this.$store);  //NoOp to stop reload till queue is processed
      this.addUndo(event);
    },
    sectionChanged()
    {
      return (this.section.html!=this.$refs.section_text.innerHTML);
    },
    getUndo()
    {
      if (!this.section.undo)
      {
        this.section.undo=[];
        this.section.undo.latestIndex = -1;        
      }
      return this.section.undo;
    },
    addUndoItem(undo, undoContent)
    {
      if (!undo)
      {
        return;
      }

      if (undo.latestIndex<Common.MAX_UNDO_ITEMS)
      {
        undo.latestIndex+=1;
        // this.section.undo.push( { html: this.$refs.section_text.innerHTML, timestamp: Date() } );  
      }
      else
      {
        undo.latestIndex=0;
      }
      undo.splice(undo.latestIndex, 1,  { content: undoContent, timestamp: Date() } );  
    },
    addUndo(event)
    {
      var undo = this.getUndo();
      if (this.sectionChanged())
      {
        this.addUndoItem(undo, this.$refs.section_text.innerHTML);
      }
    },
    getLastUndoItem()
    {
      var undo = this.getUndo();
      console.log('1', undo);
      if (undo.length>1)
      {
        var lastIndex=0;
        var potentialUndo=null, currentUndo=null;
        var undoItem = undo[undo.latestIndex];

        console.log('6', undo.latestIndex);
        if (undo.latestIndex>1)
        {
          console.log('2');
          potentialUndo = undo[undo.latestIndex-1];
          currentUndo = undo[undo.latestIndex];          
          lastIndex = undo.latestIndex-1;
          // lastIndex= undo.latestIndex-1;
        }
        else if (undo.latestIndex==0 && undo.length==(Common.MAX_UNDO_ITEMS-1))
        {
          console.log('3');
          //loop to top?
          potentialUndo = undo[Common.MAX_UNDO_ITEMS-1];
          currentUndo = undo[0];
          lastIndex = Common.MAX_UNDO_ITEMS-1;
        }

        if ( potentialUndo && (potentialUndo.timestamp <= currentUndo.timestamp) )
        {
          console.log('4');
          undo.latestIndex = lastIndex;
          undoItem = potentialUndo;
        }       

        return undoItem.content;
        // if (this.section.undo && this.section.undo[last])
        // {
        //   this.$refs.section_text.innerHTML = this.section.undo[last].html;
        //   if (this.section.undo.latestIndex>0)
        //   {
        //     this.section.undo.latestIndex--;          
        //   }
        //   else
        //   {
        //     this.section.undo.latestIndex==20; 
        //   }
        // }        
      }
      console.log('5');
    },
    undoLast()
    {
      console.log('undo');
      var item = this.getLastUndoItem();
      if (item)
      {
        this.$refs.section_text.innerHTML = item;  
      }
      
      // if (this.section.undo.length>0)
      // {
      //   var last = this.section.undo.latestIndex-1;

      //   if (this.section.undo && this.section.undo[last])
      //   {
      //     this.$refs.section_text.innerHTML = this.section.undo[last].html;
      //     if (this.section.undo.latestIndex>0)
      //     {
      //       this.section.undo.latestIndex--;          
      //     }
      //     else
      //     {
      //       this.section.undo.latestIndex==20; 
      //     }
      //   }        
      // }

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
      if (window.getSelection().rangeCount==0)
      {
        return;
      }

      var pos = TextFormatter.getCaretPixelPos(event.target);
      this.lastOffsetY = pos.top;

      this.selectedRange = window.getSelection().getRangeAt(0);
      this.selectedNode = this.selectedRange.commonAncestorContainer;  
      this.selectedBeginNode = this.selectedRange.startContainer;  
      this.selectedEndNode = this.selectedRange.endContainer;  
      this.selectedElement = event.target;   

      this.$emit('selected-text', event, { section: this.section, node: this.selectedNode, range: this.selectedRange });
      // console.log(this.selectedRange.startOffset, this.selectedRange.startContainer, this.selectedRange.endOffset, this.selectedRange.endContainer );
      if (this.selectedRange.startOffset!=this.selectedRange.endOffset)
      {
        // console.log('showFormatMenu');
        this.formattingStarted();
        // this.showFormatMenu=true;
      }
      else
      {
        this.formattingEnded();
        // this.showFormatMenu=false;
      }
      // console.log('getSelectedText', this.selectedNode, this.selectedRange.startOffset, this.selectedRange.endOffset);
      var el = event.target;
      el.focus();
    },
    selectText(begin, end, startPos, endPos) 
    {
      this.clearSelectedText();
      var range = document.createRange();
      var sel = window.getSelection();
      
      range.setStart(begin, startPos);
      range.setEnd(end, endPos);

      // range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);      
    },    
    convertToPlainText(event)
    {
      this.$refs.section_text.innerHTML = this.getSectionText_();//this.$refs.section_text.innerText;
      this.saveContents(this.$refs.section_text); 
    },
    formattingStarted()
    {
      this.formattingInProgress=true;
      // this.$store.commit('setFormattingStarted', this.section.id);
    },
    formattingEnded()
    {
      this.formattingInProgress=false;
      // this.$store.commit('setFormattingEnded', this.section.id);
    },
    isFormattingInProgress()
    {
      return this.formattingInProgress;
      // var progress = this.$store.getters.getIsFormattingInProgress;

      // if (progress.sectionId == this.section.id && progress.inProgress)
      // {
      //   return true;
      // }
      // return false;
      
    },    
    formatText(event, type)
    {      
      this.selectText(this.selectedBeginNode, this.selectedEndNode, this.selectedRange.startOffset, this.selectedRange.endOffset);
      var start = this.selectedRange.startOffset;
      var end = this.selectedRange.endOffset;
      var node = this.selectedNode;

      document.execCommand(type , false , null);

      // this.formattingEnded();
      this.checkAndQueueDeltaChange(this);
      var range = document.createRange();
      var sel = window.getSelection();

      var el = this.$refs.section_text;
      range.collapse(true);      

      sel.removeAllRanges();
      sel.addRange(range);
      
      el.focus(); 

      // this.section.html= this.$refs.section_text.innerHTML;
      // this.section.text= this.$refs.section_text.innerText;

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
      if (self.$refs.section_text==null || this.inSearchMode()) //during a move, this section can disappear and reappear in new position
      {
        return;
      }

      this.textChanged(self.section, self.$refs.section_text.innerText, self.$refs.section_text.innerHTML);
      // if (self.lastKeyDownEvent && self.section.html!=self.lastKeyDownEvent.target.innerHTML) 
      // {
      //   this.textChanged(self.section, self.lastKeyDownEvent.target.innerText, self.lastKeyDownEvent.target.innerHTML);
      //   self.lastKeyDownEvent=null;
      // }
      // else if (self.$refs.section_text.innerHTML!=self.section.html)
      // {
      //   this.textChanged(self.section, self.$refs.section_text.innerText, self.$refs.section_text.innerHTML);
      // }
      return;
    },
    getTags(text, separator)
    {
      var tags=[];
      var tagElements = this.$refs.section_text.getElementsByClassName(Common.HashTagTextClass);
      for (var i=0; i< tagElements.length; i++)
      {
        tags.push(tagElements[i].innerText);
      }
      // var result = str.match(/<b>(.*?)<\/b>/g).map(function(val){
      //   return val.replace(/<\/?b>/g,'');
      // });

      // console.log(root);
      // var tags = [].map.call( root.querySelectorAll("hashTagText"), function(v)
      // {
      //   console.log(v);
      //   return v.textContent || v.innerText || "";
      // });      
      // var hashtags = text.match(Common.HashTagMatch);

      // var tags=[];
      // if (hashtags)
      // {
      //   for (var i=0; i<hashtags.length; i++)
      //   {
      //     var t = hashtags[i].split(separator).filter(x => x);
      //     if (t.length>0)
      //     {
      //       tags.push(t)
      //     }
      //     else
      //     {
      //       tags.push(hashtags[i])
      //     }
      //   }
      // }
      return tags;
    },    
    getNewLineElement()
    {
      var nl = document.createElement("div");
      // var tagId = "tag_"+this.getNewTagId();
      // nl.id = tagId;
      nl.textContent="\n";
      // hashTag.className =Common.HashTagTextClass;

      return nl;
    },      
    getNewHashTagElement(text="#")
    {
      var hashTag = document.createElement("span");
      var tagId = "tag_"+this.getNewTagId();
      hashTag.id = tagId;
      hashTag.textContent=text;
      hashTag.className =Common.HashTagTextClass;

      return hashTag;
    },
    // insertHashtagAt(node)
    // {
    //   var nodeText = node.node.wholeText;
    //   var atOffset = node.offset;

    //   var range = document.createRange();
    //   var sel = window.getSelection();
      
    //   var tagText = sel.focusNode.wholeText;
    //   var startText = tagText.substring(1, atOffset);
    //   var endText = tagText.substring(atOffset, tagText.length);

    //   if (sel.anchorNode.parentNode.className==Common.HashTagTextClass)
    //   {
    //     var hashTagText = sel.anchorNode.parentNode;
    //     var tagContent = sel.anchorNode.parentNode.parentNode;
    //     var newSpan = document.createElement('span');
    //     newSpan.className = Common.HashTagTextClass;
    //     newSpan.innerHTML = tags[0];

    //     tagContent.replaceChild(newSpan, hashTagText);
    //     if (tags.length>1)
    //     {
    //       tagContent.after(" "+tags[1]);  
    //     }
    //     else if (!tagContent.nextSibling)
    //     {
    //       // console.log('no tag');
    //       tagContent.after("\u200B");
    //       // tagContent.nextSibling.after(" ");
    //       // console.log('next sibling', tagContent.nextSibling);
    //       // tagContent.nextSibling.after(" ");
    //     }
    //     else
    //     {
    //       tagContent.after(" ");
    //     }

    //     // var range = document.createRange();
    //     // var sel = window.getSelection();

    //     // range.setStart(newSpan, 1);
    //     range.setStart(tagContent.nextSibling, 1);
    //     // range.collapse(false);  
        
    //     sel.removeAllRanges();
    //     sel.addRange(range);
    //     el.focus();      

    //     var next = tagContent.nextSibling;
    //     // tagContent.appendChild(newSpan);
    //     // parentNode.after("A");
    //     // parentNode.insertAfter('&nbsp;', el);
    //   }
    // },
    startHashTag()
    {
      var currentNode = TextFormatter.getCurrentNode();
      // var currentNode = TextFormatter.getCaretPos();

      var hashTag = this.getNewHashTagElement();
      // TextFormatter.insertHashtagAt(currentNode);
      currentNode.parentNode.appendChild(hashTag);
      TextFormatter.setCaretToEndOfElementById(hashTag.id)
      // hashTag.focus();    
      
    },
    removeTrailingLinebreak(element) 
    {
        let children = Array.from(element.childNodes)

        children.forEach(child => {
          // console.log(child);
            if (child.className==Common.HashTagTextClass)
            {
              console.log('found tag');
              let kids = Array.from(child.childNodes);
              kids.forEach(kid => {
                console.log('kid', kid);
                if (kid.tagName && kid.tagName === "BR") {
                  console.log('removing kid');
                    child.removeChild(kid)
                }                
              });
            }
          });            
    }, 
    markHtml(element, makeEditable='false')
    {
      var hrefElements = element.getElementsByTagName("a");
      // console.log(hrefElements);
      if (hrefElements)
      {
        for (var i=0; i<hrefElements.length; i++)
        {
          hrefElements[i].setAttribute('target', '_blank');
          hrefElements[i].setAttribute('contenteditable', makeEditable);
          // hrefElements[i].after('-');
        }
      }
      return
    },
    getNewTagId()
    {
        var id = uuid.v4();
        return id;
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

        //update the section for searches later
        // console.log('section text changed');
        // this.section.text = this.$refs.section_text.textContent;
        // this.section.html = this.$refs.section_text.innerHTML; 
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
    getSectionText_()
    {
      return this.$refs.section_text.textContent;
    },
    getSectionHtml_()
    {
      return this.$refs.section_text.innerHTML;
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
    startTagMarking()
    {
      this.tagStarted=true;
    },
    endTagMarking()
    {
      this.tagStarted=false;
    },    
    resetTagText()
    {
      this.tagText=Common.Key_Hash;
    },
    addToTagText(key)
    {
      this.tagText+=key;
      return true;
    },
    endOrContinueTagMarking(character)
    {
      // var charactersToStop = ;
      if (Common.CharactersStopTagMarking.includes(character))
      {
        this.endTagMarking();
      }
      return;
    },
    insertTag()
    {
      if (this.tagStarted)
      {
        this.endTagMarking();

        var curPosition = TextFormatter.currentPosition();

        var lastHashtag = TextFormatter.getOffsetOfLastCharacter(curPosition, Common.HashTag); 
        if (lastHashtag.found)
        {
          // TextFormatter.deleteText(curPosition, ((this.tagText.length)*-1) ); 
          var tagText = lastHashtag.tag;
          TextFormatter.deleteText(curPosition, (tagText.length)*-1 ); 
          var tagElement = TextFormatter.insertElementAt(curPosition, 'span', tagText, Common.HashTagTextClass); 
          tagElement.contentEditable = 'false';

          this.setTagClick();
        }
      }
    },
    processKeyUpOrDown(event, isUp)
    {
      var eventType=Common.KeyEventTypes.Up;;
      if (!isUp)
      {
        eventType = Common.KeyEventTypes.Down;
      }
      //find if we're at the top of the section or bottom by checking if the caret moves and then move up or down
      var pos = TextFormatter.getCaretPixelPos(event.target);
      this.lastOffsetY = pos.top;        
      Common.sleep(5).then(() => 
      {
        var pos = TextFormatter.getCaretPixelPos(event.target);
        if (this.lastOffsetY==pos.top || this.between(this.lastOffsetY, pos.top-maxOff, pos.top+maxOff))
        {
          this.emitKeyDownPress(event, eventType, this.section);  
        }          
        else
        {
          this.lastOffsetY=pos.top;
        }
      });
    },
    keyDownMonitor(event)
    {
      this.resetSearchText();
      this.endOrContinueTagMarking(event.key);
      var maxOff=8;

      if (event.key==Common.Key_Up && !this.shiftPressed)
      {
        this.processKeyUpOrDown(event, true);
        // event.stopPropagation(); 
        // event.preventDefault();        
      }
      else if (event.key==Common.Key_Down &&  !this.shiftPressed)
      {
        this.processKeyUpOrDown(event, false);
      }      
      else if (event.key==Common.Key_Space)
      {
        this.insertTag();
      }
      else if (event.key==Common.Key_Hash )
      {   
        this.startTagMarking();
        // this.resetTagText();
      }
      else if (event.key==Common.Key_Shift )
      {        
        this.shiftPressed = true;
      }
      else if (event.key==Common.Key_Control )
      {        
        this.ctrlPressed = true;
      }
      else if (event.key.toLowerCase()=='z' && this.ctrlPressed)
      {        
        this.undoLast();
      }      
      else if (this.shiftPressed!=true && event.key=="Tab")
      {     
        this.commitContentsToSection();
        this.emitKeyDownPress(event, 'tab', this.section);
      }
      else if (this.shiftPressed && event.key=="Tab")
      {
        //moving this section, so save the text first
        this.commitContentsToSection();
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

        var result = TextFormatter.DeleteNonContentEditable(event.target);
        if (result)
        {
          event.preventDefault();
          event.stopPropagation();  
        }
        else
        {
          var src = event.target.innerText
          if (src.trim()=="")
          {
            this.sectionIsDeleted=true;
            this.emitKeyDownPress(event, 'backspace-blank-section', this.section);
                      // event.preventDefault();
            event.stopPropagation(); 
            event.preventDefault();
            // event.stopPropagation();  
          }          
        }
      }
    },  
    between(c, a, b) {
      var min = Math.min.apply(Math, [a, b]),
      max = Math.max.apply(Math, [a, b]);
      return c > min && c < max;
    },
    commitContentsToSection()
    {
      if (!this.inSearchMode())
      {
        this.section.text = this.$refs.section_text.innerText;
        this.section.html = this.$refs.section_text.innerHTML;           
      }
    },
    keyUpMonitor(event) 
    {  
      this.lastKeyDownEvent = event;
      this.startPolling();      

      //shift-enter would be to add a line break to the content. We only want to catch Enter 
      //to add a new section
      if (event.key==Common.Key_Up)
      {
        // this.emitKeyDownPress(event, Common.KeyEventTypes.Up, this.section);
        // event.stopPropagation(); 
        // event.preventDefault();        
      }
      else if (event.key==Common.Key_Down)
      {
        // this.emitKeyDownPress(event, Common.KeyEventTypes.Down, this.section);  
        // event.stopPropagation(); 
        // event.preventDefault();        
      } 
      else if (event.key=="Enter" && !this.shiftPressed)
      {
        this.emitKeyPress(event, this.section);
      }  
      else if (event.key=="Shift")
      {
        this.shiftPressed=false; 
      }
      else if (event.key==Common.Key_Control)
      {
        this.ctrlPressed=false;
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
        if (!this.sectionIsDeleted)
        {                  
          this.commitContentsToSection();
          this.saveContents(event.target);  
          this.$emit('section-in-blur', event, this.section, this.depth);
        }
      }
    },
    saveContents(target)
    {
      if (!this.inSearchMode())
      {                
        this.checkAndQueueDeltaChange(this);
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
      // this.markHtml(event.target, 'true'); 
      // event.target.innerHTML+=" ";
      // if (!this.isFormattingInProgress())
      // {
      //   this.showFormatMenu=false;
      // }      
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
    },   
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

a {
  cursor: pointer;
}

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

.hashGrey {
  color: grey;
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
