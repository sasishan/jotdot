<template>
  <div >
  <br><br><br>
<!--    <span :style="getSectionsLength>0 ? formatIndent : formatNoUpIndent" v-if="showFormatMenu && allowEdit==true" >
      <Notes_Formatter @format-text="formatText" />        
    </span>     
    <span :style="upIndent" v-if="getSectionsLength>0 && allowEdit==true" >
      <Notes_Up @updown-click="openCloseSection" :open="getOpenState" />        
    </span>  
     <span :style="getSectionsLength>0 ? menuIndent :  upIndent" v-if="allowEdit==true">
      <Notes_Menu @flyout-click="selectSection" :sectionId="getId" v-if="allowEdit==true" @set-plain-text="convertToPlainText"/>      
    </span>    
     <span :style="bulletIndent" v-if="allowEdit==true">
      <Notes_Flyout @flyout-click="selectSection" :section="section" :sectionId="getId" v-if="allowEdit==true"/>      
    </span>-->
    <div 
      id="main"
      ref="section_text"         
      v-html="sectionText"
      :style="sectionIndent" 
      :contenteditable="true" 
      v-on:keydown="keyDownMonitor"
      @input="inputText">
    </div>
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
import TextFormatter from '../TextFormatter.js';
import { uuid } from 'vue-uuid';

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

function setLastLineBreak(element, self)
{
  var selection = window.getSelection();
  console.log(selection);
  var parent = selection.anchorNode;
  console.log(parent);
  // var range = document.createRange();
  // var range = window.getSelection().getRangeAt(0);
  var range = document.createRange();
  // range.setEnd(element, selection.anchorOffset);
  range.selectNodeContents(element);
  var previousNode = range.cloneContents().lastChild;
  
  // console.log(previousNode.nodeValue, previousNode.nodeType, previousNode.nodeName, previousNode.outerText);
  if (previousNode && previousNode.nodeName=='BR')
  {
    // var newLine = self.getNewLineElement();
    // console.log(newLine);
    // previousNode = newLine;
    // previousNode.className="shiftEnter";
    // parent.replaceChild(newLine, previousNode);
    // console.log(previousNode);
  }
  // range.setEndBefore(selection.anchorNode);
  // range.setStart(element, range.endOffset - 1);
  // var previousNode = range.cloneContents().lastChild;
  
}

function setCaretPositionSpace(el, self) 
{
  var range = document.createRange();
  var sel = window.getSelection();
  
  var tagText = sel.focusNode.wholeText;
  var tags = tagText.split(" ");


  if (sel.anchorNode.parentNode.className==Common.HashTagTextClass)
  {
    var hashTagText = sel.anchorNode.parentNode;
    var tagContent = sel.anchorNode.parentNode.parentNode;

    var tagElement = self.getNewHashTagElement(tags[0]);
    // var newSpan = document.createElement('span');
    // newSpan.className = Common.HashTagTextClass;
    // newSpan.innerHTML = tags[0];

    tagContent.replaceChild(tagElement, hashTagText);
    if (tags.length>1)
    {
      tagElement.after(" "+tags[1]);  
    }
    else
    {
      tagElement.after(" ");    
    }    
    
    // if (tags.length>1)
    // {
    //   tagContent.after(" "+tags[1]);  
    // }
    // else if (!tagContent.nextSibling)
    // {
    //   // console.log('no tag');
    //   tagContent.after("\u200B");
    //   // tagContent.nextSibling.after(" ");
    //   // console.log('next sibling', tagContent.nextSibling);
    //   // tagContent.nextSibling.after(" ");
    // }
    // else
    // {
    //   tagContent.after(" ");
    // }

    // var range = document.createRange();
    // var sel = window.getSelection();

    // range.setStart(newSpan, 1);

    range.setStart(tagElement.nextSibling, 1);
    range.collapse(false);  
    
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
  },
  mounted()
  {
    //JQUERY events to catch tags
    this.setTagClick();
  },
  data: function() 
  {
    return { 
      sectionText:"AA",
      tagText:"",

      tagStarted:false,
      poll:null,
      lastKeyDownEvent:null,
      htmlText:'',

      sectionHtml:'', 
      
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
    dragOptions()
    {
      return Common.DragOptions;
    },    
    inputText(event)
    { 
      // console.log('inputText', event);

      // var curPosition = TextFormatter.currentPosition();
      // TextFormatter.insertElementAt(curPosition);
      // Operations.addPlaceHolderNoOp(this.$store);  //NoOp to stop reload till queue is processed
    },
    // checkHighlightedText(event)
    // {
    //   if (!this.selectedRange.empty)
    //   {
    //     var clientRectangles = this.selectedRange.getClientRects();
    //     for(var i = 0 ; i < clientRectangles.length ; i++) {
    //       if(event.pageX >= clientRectangles[i].left && event.pageX <= clientRectangles[i].right &&
    //          event.pageY >= clientRectangles[i].top  && event.pageY <= clientRectangles[i].bottom
    //         ) 
    //       {
    //         //show the pop up
    //         console.log('Show menu');
    //         break;
    //       }
    //     }

    //   }
    // },
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
      this.selectedRange = window.getSelection().getRangeAt(0);
      
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
      // console.log(sel);
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
      // console.log('selectedRange', this.selectedRange);
      // var el = this.$refs.section_text;
      // el.focus(); 
      this.selectText(this.selectedBeginNode, this.selectedEndNode, this.selectedRange.startOffset, this.selectedRange.endOffset);
      var start = this.selectedRange.startOffset;
      var end = this.selectedRange.endOffset;
      var node = this.selectedNode;

      // event.preventDefault();
      // event.stopPropagation();  
      // this.selectText(this.selectedRange.startOffset, this.selectedRange.endOffset);
      // console.log('formatText',type, this.selectedBeginNode, this.selectedEndNode, this.selectedRange.startOffset, this.selectedRange.endOffset);
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
      // if (self.$refs.section_text==null) //during a move, this section can disappear and reappear in new position
      // {
      //   return;
      // }

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
          console.log(child);
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
    markTags(element, html, separator) 
    {
      var whiteSpace = "&#8203;"; 
      // var childs = element.childNodes;

      // for (var i = 0; i < childs.length; i++) 
      // {
      //   if (childs[i].className==Common.TagContentClass)
      //   {
      //     continue;
      //   }
      //   console.log(childs[i].innerHTML); 
      //   if (childs[i].innerHTML)
      //   {
      //     childs[i].innerHTML = childs[i].innerHTML.replace(/#(\w+)/g,
      //     " <span class='" + Common.TagContentClass + "'><span class='" +
      //     Common.HashTagTextClass + "'>#$1</span></span>"+ whiteSpace);
      //     // console.log(childs[i].textContent);          
      //   }

      // }
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
      
      // html = html.replace("<br>#", "<br> #");
      // html = html.replace(/\u00A0/g, '');

      // this.markHtml(element, 'false'); 

      html = html.replace(/&nbsp;/g, ' ');
      // html = html.replace('<br>', ' '); //for firefox only
      // console.log('replace br', html);
      // this.removeTrailingLinebreak(element);
      var tagId = "tag_"+this.getNewTagId();
      html = html.replace(/\s#(\S*)/g,
        " <span id='"+tagId+"' contenteditable='false' class='" + Common.HashTagTextClass + "'>#$1</span>"+whiteSpace);
      // html = html.replace(/#(\w+)/g,
      //   " <span class='" + Common.TagContentClass + "'><span class='" +
      //   Common.HashTagTextClass + "'>#$1</span></span>"+ whiteSpace);
      // var hash= "<span class='hashGrey'>#</span>";
      // var tagId = "tag_"+this.getNewTagId();
      // html = html.replace(/#(\w+)/g, 
      //         hash+"<span id='"+tagId+"' class='" + Common.HashTagTextClass + "'>$1</span>"+ whiteSpace);


      //Contentnoteditable
      // var hash= "<span class='hashGrey'>#</span>";
      // var tagId = "tag_"+this.getNewTagId();
      // html = html.replace(/#(\w+)/g, 
      //         "<span id='"+tagId+"' contenteditable='false' class='" + Common.HashTagTextClass + "'>$1</span> ");


      // html = html.replace(/(^|\s)(#[a-z\d-]+)/ig,
      //   "$1<span class='" +
      //   Common.HashTagTextClass + "'>$2</span>"+ whiteSpace);
      

      
      // console.log('after',html);
      return { html: html, tagId: tagId};
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
      // console.log('keydown', event.target.innerHTML);  
      
      // var sectionOffset = TextFormatter.getCaretPosition(event.target);
      console.log('sectiontop', event.target.offsetTop);
          Common.sleep(100).then(() => 
          {
            // setCaretPositionSpace(event.target, this);
                  var pos = TextFormatter.getCaretPixelPos(event.target);
                  console.log(pos);
          }); 
      

      if (this.tagStarted)
      {
        this.tagText+=event.key;
      }

      if (event.key==" ")
      {
        if (this.tagStarted)
        {
          this.endMarking();
          console.log('end marking', this.tagText);
          var curPosition = TextFormatter.currentPosition();
          TextFormatter.deleteText(curPosition, ((this.tagText.length-1)*-1) ); 
          var tagElement = TextFormatter.insertElementAt(curPosition, 'span', this.tagText, Common.HashTagTextClass); 
          tagElement.contentEditable = 'false';         
        }
        else
        {
          Common.sleep(100).then(() => 
          {
            // setCaretPositionSpace(event.target, this);
          });            
        }
        // this.removeTrailingLinebreak(event.target);

      }
      else if (event.key=="#" )
      {   
        // event.preventDefault();
        // event.stopPropagation();          
        this.startMarking();
        this.tagText="#";
        // this.startHashTag();
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
          // this.markHtml(event.target, 'false'); 
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
        // this.checkAndQueueDeltaChange(this);
        // this.setSectionHTML(target);
        // var tags = this.markTags(target, this.section.html, '#');
        // this.section.html = tags.html;

        // this.$emit('save-section');   

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
