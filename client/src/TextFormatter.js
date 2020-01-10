var TextFormatter={};

TextFormatter.setEndOfContenteditable = function(contentEditableElement)
{
    var range,selection;
    if (contentEditableElement!=null)
    {
      if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
      {
          range = document.createRange();//Create a range (a range is a like the selection but invisible)
          // console.log(contentEditableElement);
          range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
          range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
          selection = window.getSelection();//get the selection object (allows you to change selection)
          selection.removeAllRanges();//remove any selections already made
          selection.addRange(range);//make the range you have just created the visible selection
      }
      else if(document.selection)//IE 8 and lower
      { 
          range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
          range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
          range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
          range.select();//Select the range (make it the visible selection
      }      
    }
}

  // console.log('SetCaretPositionSpace', sel.anchorNode.parentNode.className);

  // var parentNode = sel.anchorNode.parentNode;
  // var NewElement = document.createElement('div');
  // NewElement.innerHTML = ' ';
  // if (sel.anchorNode.parentNode.className==Common.HashTagTextClass)
  // {
  //   console.log('In tag');
  //   // parentNode.after("A");
  //   // parentNode.insertAfter('&nbsp;', el);
  // }

  // console.log(el.childNodes);
  // for (var i=0; i<el.childNodes.length; i++)
  // {
  //   child = el.childNodes[i];

  //   if (child.className==Common.TagContentClass)
  //   {
  //     range.setStart(el.childNodes[i+1], 1);
  //     range.collapse(true);      
  //   }
  // }
  // range.setStart(el.childNodes[0], caretPos);
  // range.collapse(true);
  
  // sel.removeAllRanges();
  // sel.addRange(range);
  
  // el.focus();  
// }

TextFormatter.SetCaretPositionEndOfTag = function(el, text) 
{
  var range = document.createRange();
  var sel = window.getSelection();

  for (var i=0; i<el.childNodes.length; i++)
  {
    child = el.childNodes[i];

    if (child.className==Common.TagContentClass)
    {
      range.setStart(el.childNodes[i+1], 1);
      range.collapse(true);      
    }
  }
  
  sel.removeAllRanges();
  sel.addRange(range);
  
  el.focus();  
}

Common.InsertTextAtCursor = function(text) {
    var sel, range;
    if (window.getSelection) 
    {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
          console.log('a')
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode( document.createTextNode(text) );
            range.collapse(true);  
        }
    } else if (document.selection && document.selection.createRange) 
    {
        document.selection.createRange().text = text;
    }
}

module.exports = TextFormatter;