var TextFormatter={};

var position = {node: null, offset: 0};

TextFormatter.currentPosition = function(index=0)
{
  var selection = window.getSelection().getRangeAt(index);

  if (selection.collapsed)
  {
    position.node = selection.startContainer;
    position.offset = selection.startOffset;

    console.log(selection);
    // position.top = selection.offsetTop;
    // position.left = selection.offsetLeft;

    return position;
  }
  else
  {
    console.log('Range selected');
    return null;
  }
  
  // return range;
}

TextFormatter.getOffsetOfLastCharacter = function(position, characterToMatch)
{
  var offset = { found: false, offset: 0};
  if (position.node)
  {
    var node = position.node;
    var content = node.textContent;
    for (var i=position.offset; i>=0 ; i--)
    {
      if (content[i]==characterToMatch)
      {
        offset.found =true;
        offset.offset = i;
        offset.tag = content.substring(i, position.offset);
      }
    }

    return offset;
  } 
}

TextFormatter.deleteText = function(position, offsetFromCurrent)
{
  // console.log(position, offsetFromCurrent);
  if (position.node)
  {
    var node = position.node;
    var content = node.textContent;
    var firstHalf = content.substring(0, position.offset+offsetFromCurrent);
    var secondHalf = content.substring(position.offset, content.length);
    
    node.textContent = firstHalf + secondHalf;

    var newPosition = {node: node, offset: position.offset+offsetFromCurrent};
    TextFormatter.setCaretPosition(newPosition);
  } 
}

TextFormatter.getFirstHalf = function(position)
{
  // console.log(position);
  if (position.node)
  {
    var node = position.node;
    var content = node.textContent;
    var firstHalf = content.substring(0, position.offset);
    // var secondHalf = content.substring(position.offset, content.length);
    
    node.textContent = firstHalf;

    return node;
    // var newPosition = {node: node, offset: position.offset};
    // TextFormatter.setCaretPosition(newPosition);
  } 
}

TextFormatter.getLatterHalf = function(position)
{
  console.log(position);
  if (position.node)
  {
    var node = position.node;
    var content = node.textContent;

    console.log(content);
    var secondHalf = content.substring(position.offset, content.length);
    console.log(secondHalf);
    // var secondHalf = content.substring(position.offset, content.length);
    
    // node.textContent = secondHalf;

    return node;
    // var newPosition = {node: node, offset: position.offset};
    // TextFormatter.setCaretPosition(newPosition);
  } 
}

TextFormatter.setCaretPosition = function(position)
{
  if (position.node)
  {
    var node = position.node;
    var range = document.createRange();    
    var selection = window.getSelection();

    range.setStart(position.node, position.offset);
    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start  
    selection.removeAllRanges();//remove any selections already made
    selection.addRange(range);//make the range you have just created the visible selection
  } 
}

TextFormatter.insertElementAt = function(position, elementType, elementText, elementClass)
{
  if (position.node)
  {
    var node = position.node;
    var parent = node.parentNode;

    var content = node.textContent;
    var firstHalf = content.substring(0, position.offset);
    var secondHalf = content.substring(position.offset, content.length);
    
    var firstHalfNode = document.createTextNode(firstHalf);
    var secondHalfNode = document.createTextNode(secondHalf);
    var newElement = document.createElement(elementType);
    newElement.className=elementClass;
    newElement.textContent = elementText;

    parent.replaceChild(firstHalfNode, node);

    firstHalfNode.after(newElement);
    newElement.after(secondHalfNode);

    TextFormatter.setCaretToEndOfElement(secondHalfNode);

    return newElement;
  } 
}

TextFormatter.setCaretToEndOfElement = function(element)
{
  var range = document.createRange();
  var selection = window.getSelection();

  range.selectNodeContents(element);//Select the entire contents of the element with the range

  range.collapse(true);//collapse the range to the end point. false means collapse to end rather than the start  
  selection.removeAllRanges();//remove any selections already made
  selection.addRange(range);//make the range you have just created the visible selection
}

TextFormatter.getCaretPixelPos = function ($node, offsetx, offsety){
    offsetx = offsetx || 0;
    offsety = offsety || 0;

    var nodeLeft = 0,
        nodeTop = 0;
    if ($node){
        nodeLeft = $node.offsetLeft;
        nodeTop = $node.offsetTop;
    }

    var pos = {left: 0, top: 0};

    if (document.selection){
        var range = document.selection.createRange();
        pos.left = range.offsetLeft + offsetx - nodeLeft;
        pos.top = range.offsetTop + offsety - nodeTop ;
    }else if (window.getSelection){
        var sel = window.getSelection();
        var range = sel.getRangeAt(0).cloneRange();
        try{
            range.setStart(range.startContainer, range.startOffset-1);
        }catch(e){
          // Range was not selected because offset was negative
          // Ignore error: DOMException: Failed to execute 'setStart' on 'Range': The offset -1 is larger than or equal to the node's length
        }
        var rect = range.getBoundingClientRect();
        if (range.endOffset == 0 || range.toString() === ''){
            // first char of line
            if (range.startContainer == $node){
                // empty div
                if (range.endOffset == 0){
                    pos.top =  offsetx;
                    pos.left = offsety;
                }else{
                    // firefox needs this
                    var range2 = range.cloneRange();
                    range2.setStart(range2.startContainer, 0);
                    var rect2 = range2.getBoundingClientRect();
                    pos.left = rect2.left + offsetx - nodeLeft;
                    pos.top = rect2.top + rect2.height + offsety - nodeTop;
                }
            }else{
              // not empty div
                if(range.startContainer.offsetTop){
                  // range was selected
                    pos.top = range.startContainer.offsetTop ;
                    pos.left = range.startContainer.offsetLeft;
                }else{
                  // range was not selected (probably because caret is at first char of line that already had text)
                    pos.left = rect.left + rect.width + offsetx - nodeLeft ;
                    pos.top = rect.top + offsety - nodeTop;

                }
            }
        }else{
          // not first char of line
            pos.left = rect.left + rect.width + offsetx - nodeLeft;
            pos.top = rect.top + offsety - nodeTop ;
        }
    }
    return pos;
};


/////////////////////////
TextFormatter.getRange = function(index=0)
{
  var range = window.getSelection().getRangeAt(index);
  return range;
}

TextFormatter.getCurrentNode = function()
{
  var selectedRange = window.getSelection().getRangeAt(0);
  var selectedNode = selectedRange.commonAncestorContainer; 
  // console.log(selectedRange.startContainer, selectedRange.startOffset);
  return selectedNode;
}

TextFormatter.getCaretPos = function(el)
{
  var caretOffset = 0;
  var range = window.getSelection().getRangeAt(0);
  caretOffset = preCaretRange.toString().length;
  
  return { node: selectedRange.startContainer, offset: selectedRange.startOffset };
}

TextFormatter.DeleteNonContentEditable=function(element)
{
  var selection = window.getSelection();
  if (!selection.isCollapsed || !selection.rangeCount) {
      return false;
  }

  var curRange = selection.getRangeAt(selection.rangeCount - 1);
  if (curRange.commonAncestorContainer.nodeType == 3 && curRange.startOffset > 0) {
      // we are in child selection. The characters of the text node is being deleted
      return false;
  }

  var range = document.createRange();
  if (selection.anchorNode != element) 
  {
      // selection is in character mode. expand it to the whole editable field
      range.selectNodeContents(element);
      range.setEndBefore(selection.anchorNode);
  } 
  else if (selection.anchorOffset > 0) 
  {
      range.setEnd(element, selection.anchorOffset);
  } 
  else 
  {
      // reached the beginning of editable field
      return false;
  }
  try 
  {
    range.setStart(element, range.endOffset - 1);
  }
  catch (e)
  {
    return false; 
  }
  

  var previousNode = range.cloneContents().lastChild;

  if (previousNode && (previousNode.contentEditable == 'false' || previousNode.isContentEditable == false) )
  {
      range.deleteContents();
      return true;
  }

  return false;
}

TextFormatter.setCaretToEndOfElementById = function(elementId)
{
  var start=true;
  var end = false;
  var el = document.getElementById(elementId);

  // el.focus();
  if (el && el.nextSibling)
  {
    el = el.nextSibling;
    TextFormatter.setStartOrEndOfElement(el, end);
  }
  else if (el)
  {
    TextFormatter.setStartOrEndOfElement(el, end);  
  }
  
  // document.getSelection().collapse(el, pos);
}

TextFormatter.setStartOrEndOfElement = function(el, start)
{
  var range = document.createRange();
  var selection = window.getSelection();

  range.selectNodeContents(el);//Select the entire contents of the element with the range

  if (start)
  {
    // console.log('start',el);
    range.collapse(true);//collapse the range to the end point. false means collapse to end rather than the start  
  }
  else
  {
    // console.log('end',el);
    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
  }
  
  selection.removeAllRanges();//remove any selections already made
  selection.addRange(range);//make the range you have just created the visible selection

}


TextFormatter.getCaretPosition = function(el)
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
  
  return {caretOffset:caretOffset, range: range };
}

// TextFormatter.setCaretPosition = function(el, positionRange)
// {
//   var range = document.createRange();
//   var sel = window.getSelection();

//   var setRange = positionRange.range;
//   console.log('setRange', setRange);
//   // range.setStart(setRange.endContainer, setRange.endOffset);
//   // range.collapse(true); 
//   // sel.removeAllRanges();
//   // sel.addRange(range);
  
//   // el.focus();    
// }


// TextFormatter.SetCaretPositionEndOfTag = function(el, tagClassName) 
// {
//   var range = document.createRange();
//   var sel = window.getSelection();

//   for (var i=0; i<el.childNodes.length; i++)
//   {
//     child = el.childNodes[i];

//     if (child.className==tagClassName)
//     {
//       range.setStart(el.childNodes[i+1], 1);
//       range.collapse(true);      
//     }
//   }
  
//   sel.removeAllRanges();
//   sel.addRange(range);
  
//   el.focus();  
// }

// TextFormatter.setEndOfContenteditable = function(contentEditableElement)
// {
//     var range,selection;
//     if (contentEditableElement!=null)
//     {
//       if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
//       {
//           range = document.createRange();//Create a range (a range is a like the selection but invisible)
//           // console.log(contentEditableElement);
//           range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
//           range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
//           selection = window.getSelection();//get the selection object (allows you to change selection)
//           selection.removeAllRanges();//remove any selections already made
//           selection.addRange(range);//make the range you have just created the visible selection
//       }
//       else if(document.selection)//IE 8 and lower
//       { 
//           range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
//           range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
//           range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
//           range.select();//Select the range (make it the visible selection
//       }      
//     }
// }

//   // console.log('SetCaretPositionSpace', sel.anchorNode.parentNode.className);

//   // var parentNode = sel.anchorNode.parentNode;
//   // var NewElement = document.createElement('div');
//   // NewElement.innerHTML = ' ';
//   // if (sel.anchorNode.parentNode.className==Common.HashTagTextClass)
//   // {
//   //   console.log('In tag');
//   //   // parentNode.after("A");
//   //   // parentNode.insertAfter('&nbsp;', el);
//   // }

//   // console.log(el.childNodes);
//   // for (var i=0; i<el.childNodes.length; i++)
//   // {
//   //   child = el.childNodes[i];

//   //   if (child.className==Common.TagContentClass)
//   //   {
//   //     range.setStart(el.childNodes[i+1], 1);
//   //     range.collapse(true);      
//   //   }
//   // }
//   // range.setStart(el.childNodes[0], caretPos);
//   // range.collapse(true);
  
//   // sel.removeAllRanges();
//   // sel.addRange(range);
  
//   // el.focus();  
// // }

// TextFormatter.SetCaretPositionEndOfTag = function(el, text, contentClass) 
// {
//   var range = document.createRange();
//   var sel = window.getSelection();

//   for (var i=0; i<el.childNodes.length; i++)
//   {
//     child = el.childNodes[i];

//     if (child.className==contentClass)
//     {
//       range.setStart(el.childNodes[i+1], 1);
//       range.collapse(true);      
//     }
//   }
  
//   sel.removeAllRanges();
//   sel.addRange(range);
  
//   el.focus();  
// }

// TextFormatter.InsertTextAtCursor = function(text) {
//     var sel, range;
//     if (window.getSelection) 
//     {
//         sel = window.getSelection();
//         if (sel.getRangeAt && sel.rangeCount) {
//           console.log('a')
//             range = sel.getRangeAt(0);
//             range.deleteContents();
//             range.insertNode( document.createTextNode(text) );
//             range.collapse(true);  
//         }
//     } else if (document.selection && document.selection.createRange) 
//     {
//         document.selection.createRange().text = text;
//     }
// }

export default TextFormatter;