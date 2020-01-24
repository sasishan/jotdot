var Common={};


var urlBase = 'http://localhost:3010';

Common.AppName = "JotDot";

Common.DefaultDebounceTimeInMS = 5;
Common.DefaultOpsQueuePollingInMS = 5000;
Common.DefaultTextChangePollingInMS = 3000;
Common.MaxBreadCrumbText = 30;
Common.HashTagMatch = /#\S+/g;

Common.HashTag = '#';
Common.TagContentClass="tagContent";
Common.HashTagTextClass="hashTagText";
Common.TagContentNubClass = "tagContentEnd";
Common.PersonTag = '@';

Common.PersonTag = /@\S+/g;
Common.SearchPlaceholder="Search this jot..."

Common.APPEND_SECTION = -1;

Common.Key_Space = " ";
Common.Key_Enter = "Enter";
Common.Key_Hash = "#";
Common.Key_Shift = "Shift";
Common.Key_Up = "ArrowUp";
Common.Key_Down = "ArrowDown";
Common.Key_Control='Control';

Common.MAX_UNDO_ITEMS = 20;

Common.InitialSectionHtml = "</br>";

Common.CharactersStopTagMarking = [Common.Key_Up, Common.Key_Down, Common.Key_Enter];

Common.RootSectionId = '-1';
Common.Fields = 
{
    CreateDocument: 'CreateDocument',
};

Common.ConfirmDeleteStatement='deleteme';
Common.Messages = 
{
    PendingSaves: 'There is pending saves. Are you sure you want to leave?',
    PrintMode: "Print Mode",
    EditMode: "Edit Mode",
    Saved: 'saved',
    NotSaved: 'not saved',
    Loading: 'Loading, please wait...', 
    TagSearch: 'Tags',
    DeleteJot: 'Delete Jot',
    CouldNotLoad: "Could not load the contents of this Jot. Please check your permissions and try again.",
    CouldNotSync: "There was an error syncing the data. Please check your internet connection and refresh the page.",
    DeleteCancelledMessage:'Delete was cancelled',
    DeleteCancelledMessageNotMatching: "Delete was cancelled as entered text did not match",
    DeleteErrorMessage: "There was an error deleting the Jot. Please try again.",
    DeleteJotConfirmMessage: 'Jot was deleted successfully',
    ConfirmDeleteModalText: "<p>This option deletes this Jot record including all sections. Only the Jot owner " +
      "can delete a complete Jot. There is no going back once deleted.</p>"+
      "</p>Please type in <b>'"+Common.ConfirmDeleteStatement+"'</b> to confirm you want to delete this Jot, or click to cancel this action.</p>"
}

Common.URLS = 
{
   Operations: urlBase+"/api/v1/operations", 
   Documents:  urlBase+"/api/v1/documents/",
   OneJot: urlBase+"/api/v1/jots/",
   CreateJot: urlBase+"/api/v1/jots",
   DeleteJot: urlBase+"/api/v1/jots/delete/",
   GetTags: urlBase+"/api/v1/tags/",
   GetTagSections: urlBase+"/api/v1/tags/sections",
}

Common.OperationTypes = 
{
    AddSection:'addSection',
    MoveSection:'addExistingSection',
}

Common.KeyEventTypes=
{
    ShiftTab:'shift_tab',
    BackspaceBlankSection: 'backspace-blank-section',
    Up: 'key-up',
    Down: 'key-down'
}


Common.GoToSection = function(documentId, sectionId, router)
{
  router.push({name:'sectionsById', params: { jotId: documentId, sectionId: sectionId}});
}

Common.GoToJots = function(router)
{
  console.log('j');
  router.push({name:'jots'});
}

Common.GoToSignIn = function(router)
{
  router.push({name:'signin'});
}

Common.Copy= function(from, to)
{
  to =[];
  for (var i=0; i<from.length; i++)
  {
    var item = JSON.parse(JSON.stringify(from[i]));
    to.push(item);
  }
  return to;
}

Common.DragOptions = 
{
  dragClass: 'dragClass',
  ghostClass: 'ghostClass'
};

Common.sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};

Common.setEndOfContenteditable = function(contentEditableElement)
{
    var range,selection;
    if (contentEditableElement!=null)
    {
      if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
      {
          range = document.createRange();//Create a range (a range is a like the selection but invisible)
          // console.log(contentEditableElement);
          contentEditableElement.focus();
          range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
          // console.log(contentEditableElement);
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

Common.isMobile = function()
{
  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) 
  {
    return true
  } 
  else 
  {
    return false
  }
}

module.exports = Common;