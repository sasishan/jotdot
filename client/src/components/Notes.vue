<template>
  <span class="main_container">  
  <span v-if="errorOccurred===true">
    <h6 class="text-danger mt-5">{{error}}</h6>
  </span>
  <span v-if="isLoaded===false && errorOccurred===false">
    {{loadingMessage}} <font-awesome-icon size="lg" icon="spinner" class="fa-spin" />
  </span>
  <span v-if="isLoaded===true">
    <div class="float-right">
      <JotsMenu 
      @toggle-tags="toggleTags()"
      @toggle-print="togglePrint()"
      @delete-jot="showDeleteJotConfirm()"/>     
    </div>  
  </span>  
  <span v-if="isLoaded===true && showTags==false"> 
    <Notes_Breadcrumb :sectionsStack="breadCrumbs" :jot="getJot" :allowEdit=allowEdit class="mt-3"/>
    <transition name="slide-fade" mode="out-in" >
      <h4 v-if="isSwitched==true" :contenteditable=false v-html="currentMainSection.text" class="mt-2"></h4>
      <h4 v-if="isSwitched==false && currentMainSection.sectionId=='-1'" :contenteditable=allowEdit v-html="getJot.title" class="mt-2" @blur="jotTitleMonitor"></h4>      
      <h4 ref="titleSection" v-if="isSwitched==false && currentMainSection.sectionId!='-1'" :contenteditable=false v-html="currentMainSection.text" class="mt-2" @blur="titleChanged(currentMainSection)"></h4>      
    </transition>
    <draggable v-model="currentMainSection.sections" @end="dragEnd" :disabled="isMobile() || !allowEdit" v-bind="dragOptions()" >
      <transition-group name="list" tag="p" mode="out-in">
        <Notes_Section v-for="(section, index) in currentMainSection.sections" 
          :key="index" 
          :allowEdit=allowEdit
          :haveWritePermissions=haveDocWritePermissions
          :section="section" 
          :depth="0" 
          :searchText='searchText'
          :offset="0"
          v-if="isLoaded==true" 
          class="list-item"
          @section-in-focus="sectionInFocus"
          @section-in-blur="sectionBlurred"
          @section-selected="sectionSelected"
          @special-key-pressed="keyMonitor" 
          @special-key-down-pressed="keyDownMonitor"
          @save-section="saveSections"
          @backspace-begin-section="backspaceAtBegin"
          @enter-key-pressed="processEnterKey"
          />
      </transition-group>
    </draggable>
    <br>
    <Notes_Add style="float:left" @add-section-click="addNewSection" v-if="haveDocWritePermissions && allowEdit && isLoaded==true" /> 
    <div ref="scratchPad" id="scratchPad" style="visibility: hidden"></div> 
  </span>
  <span v-if="showTags==true">
    <Notes_Tags />
  </span>
  <div>
    <b-modal id="confirmDelete" 
      title="Delete Jot" 
      @show="resetConfirmDeleteText" 
      @ok="handleConfirmDeleteJot" 
      @close= "handleCancelDeleteJot"
      @cancel= "handleCancelDeleteJot"
      okTitle="Confirm" buttonSize='sm'
      no-stacking>
      <span v-html="getConfirmDeleteModalText()"></span>
      <b-form-input v-model="confirmDeleteText"></b-form-input>      
    </b-modal>
  </div>  
  </span>
</template>

<script>
import Vue from 'vue';
import NavMenu from '../components/NavMenu.vue';
import Notes_Tags from '../components/Notes_Tags.vue';
import Notes_Section from '../components/Notes_Section.vue';
import Notes_Breadcrumb from '../components/Notes_Breadcrumb.vue';
import Notes_Add from '../components/Notes_Add.vue';
import Operations from './Operations.vue';
import Comms from './Comms.vue';
import { Auth } from 'aws-amplify';
import draggable from 'vuedraggable';
import OpsConfig from '../OperationsConfig.js';
import Common from '../Common.js';
import TextFormatter from '../TextFormatter.js';
import JotsMenu from '../components/Jots_Menu.vue';
import { uuid } from 'vue-uuid';

export default 
{
  name: 'Notes',
  data() { 
    return {
      visibleSelection:[],
      currentFocusedSection:{},
      breadCrumbs:[],
      currentFocusedSectionDepth:0,
      switched:true,
      myArray:[],
      saveStyle:'',
      showData:false,
      allowEdit: true,
      toggleText: Common.Messages.PrintMode,
      hashTagSearch: Common.Messages.TagSearch,
      lastSaved:{ text:'', state: false},
      showTags: false,
      currentSectionId:null,
      error:"",
      confirmDeleteText:""
    }
  },  
  props: {
    initialJotId:null,
    search: ""
  },  
  components: 
  {
    Notes_Section,
    Notes_Breadcrumb,
    Notes_Add,
    draggable,
    NavMenu,
    Notes_Tags,
    JotsMenu
  },
  async mounted()
  {    
    // this.$store.commit('clearStoredData');
    this.switched=!this.switched;
    await this.initializeStartingJotId();  
    this.intializePendingEventAlert();  
    await this.initializeBreadCrumbsAndLoadSections();  
    this.initializeStartingSectionsList();    
  },
  destroyed()
  {
    //flush the ops buffer
    this.saveSections();
  },
  computed: 
  {
    haveDocWritePermissions()
    {
      var jot = this.$store.getters.getCurrentJot;
      if (jot && jot.permissions.write)
      {
        return true;
      }
      else
      {
        return false;
      }
    },
    getJot()
    {
      // console.log(this.$store.getters.getCurrentJot);
      if (this.$store.getters.getCurrentJot==null)
      {
        return { documentId: 'Not Ready'};
      }
      else
      {
        return this.$store.getters.getCurrentJot;  
      }
    },
    currentJotId()
    {
      return this.$store.getters.getCurrentJotId;
    },
    searchText()
    {
      return this.$store.getters.getSearchText;
    },
    loadingMessage()
    {
      return Common.Messages.Loading;
    },
    saveStateStyle()
    {
      this.saveStyle='badge badge-success';
      if (this.isSaved==true)
      {
        this.saveStyle='badge badge-danger';
      }

      return this.saveStyle;
    },    
    saveState()
    {
      return this.lastSaved.text;
    },
    // sectionsList()
    // {
    //   return this.currentSelection;
    //   // return this.$store.getters.getCurrentSelection;
    // },
    errorOccurred()
    {
      if (this.error=="")
      {
        return false;
      }
      return true;
    }
    ,
    isLoaded()
    {
      // console.log(this.$store.getters.isLoaded);
      return this.$store.getters.isLoaded;
    },
    isSwitched()
    {
      return this.switched;
    },
    currentMainSection()
    {
      return this.$store.getters.getCurrentMainSection;
    },
    getVisibleSelection()
    {
      return this.visibleSelection;
    },
    // currentSelection:
    // {
    //   get() 
    //   {
    //       return this.$store.getters.getCurrentSelection;
    //   },
    //   // need this mutation for fging
    //   set(section) 
    //   {
    //       this.$store.commit('setCurrentSelection', section);
    //       // this.$store.commit('setParentsCurrentSelection', section);
    //   }
    // }
  },    
  methods: 
  {
    backspaceAtBegin(event, section)
    {
      var parentSection = this.getSectionById([this.currentMainSection], section.parentSection, false);

      var above = this.getPriorSectionInSameParent(parentSection, section);
      if (above!=parentSection)
      {
        //its not at the top
        if (above.sections.length>0)
        {
          return; //the above doesnt have children
        }

        above.html += section.html;
        for (var i=section.sections.length-1; i>=0; i--)
        {
          var childSection = section.sections[i];
          Operations.moveSectionOps(this.$store, childSection, section, above);  
        }
        // Operations.removeSectionOp(this.$store, section, parentSection);
        Operations.removeSectionOp(this.$store, section, parentSection);

        //move to end of last section
        // var element = document.getElementById(priorSection.id);
        // Common.sleep(5).then(() => 
        // {
        //   Common.setEndOfContenteditable(element); 
        // });

        Vue.nextTick(() => {
          // .focus();
          Common.setEndOfContenteditable(document.getElementById(above.id)); 
          // console.log('foused');
        });         

        // Operations.moveSectionOps(this.$store, section, parentSection, priorSection);  
      }      
      return;
    },
    titleChanged(titleSection)
    {
      // console.log(titleSection, this.$refs.titleSection.innerHTML);
      Operations.textChangeOp(this.$store, titleSection, this.$refs.titleSection.textContent, this.$refs.titleSection.innerHTML, titleSection.tag); 
      titleSection.text = this.$refs.titleSection.textContent;
      titleSection.html = this.$refs.titleSection.innerHTML;
    },
    dragOptions()
    {
      return Common.DragOptions;
    },
    //////////////////////////
    //Modals
    //////////////////////////
    getConfirmDeleteModalText()
    {
      return Common.Messages.ConfirmDeleteModalText;
    },    
    resetConfirmDeleteText()
    {
      this.confirmDeleteText="";      
    },
    handleCancelDeleteJot()
    {
      this.showDeleteJotWasCancelled(Common.Messages.DeleteCancelledMessage);
    },
    handleConfirmDeleteJot()
    {
      var self = this;
      if (this.confirmDeleteText==Common.ConfirmDeleteStatement)
      {
        try
        {
          this.deleteJot(function(error, result)
          {
            if (error)
            {
              self.showDeleteJotWasCancelled(Common.Messages.DeleteErrorMessage);
            }
            else
            {
              self.showDeleteJotWasCompleted(Common.Messages.DeleteJotConfirmMessage);
            }
            return;

          });
        }
        catch(e)
        {
          this.showDeleteJotWasCancelled(Common.Messages.DeleteErrorMessage);
          return;
        }
      }
      else
      {
        this.showDeleteJotWasCancelled(Common.Messages.DeleteCancelledMessageNotMatching);
        return;
      }
    },
    showDeleteJotWasCancelled(message) 
    {
      this.$bvModal.msgBoxOk(message, {
        title: 'Cancelled',
        size: 'sm',
        buttonSize: 'sm',
        okVariant: 'success',
        headerClass: 'border-bottom-0',
        footerClass: 'border-top-0',
        centered: true
      })
        .then(value => {
        })
        .catch(error => {
          // An error occurred
          console.log(error);
        })
    },     
    showDeleteJotWasCompleted(message) 
    {
      this.$bvModal.msgBoxOk(message, {
        title: 'Confirmation',
        size: 'sm',
        buttonSize: 'sm',
        okVariant: 'success',
        headerClass: 'border-bottom-0',
        footerClass: 'border-top-0',
        centered: true
      })
        .then(value => 
        {
          Common.GoToJots(this.$router);
        })
        .catch(error => {
          // An error occurred
          console.log(error);
        })
    },  
    showDeleteJotConfirm()
    {
      this.$bvModal.show('confirmDelete');
    },    
    ////////////////////////////////
    // Initialize Component
    ////////////////////////////////
    async initializeStartingJotId()
    {
      
      var jotId=null;
      //check if a jot id is passed in as a prop
      if (this.initialJotId!=null)
      {
        jotId = this.initialJotId;
      }
      else
      {
        jotId = this.getJotIdFromRoute();     
      }
      
      if (jotId)
      {
        if (this.$store.getters.getCurrentJotId!=jotId)
        {
          this.$store.commit('clearStoredData');
          this.$store.commit('setCurrentJotId', jotId);
          await this.$store.dispatch('getOneJotsPermissions', jotId);
        }        
      }
      else
      {
        this.setError(Common.Messages.CouldNotLoad);
      }
    },
    initializeStartingSectionsList()
    {
      this.currentSectionId = this.getSectionIdFromRoute();  
      this.showSectionsFromSectionId(this.currentSectionId);
    },
    async initializeBreadCrumbsAndLoadSections()
    {
      if (!this.$store.getters.isLoaded)
      {
        this.resetBreadCrumbsStack();
        await this.loadSections(); 
      }
    },
    intializePendingEventAlert()
    {
      //Set an event to check for pending events
      window.addEventListener('beforeunload', (event) => 
      {
        if (this.$store.getters.getOpsQueue.length>0) 
        {
          event.returnValue = Common.Messages.PendingSaves;
        }
      });
    },
     ////////////////////////////////
    // Functions
    //////////////////////////////// 
    clearSearch()
    {
      this.$store.commit('setSearchText', "");
    },
    toggleTags()
    {
      this.allowEdit= true;
      this.showTags=!this.showTags;
    },
    togglePrint()
    {        
      this.allowEdit= !this.allowEdit;
    },
    isMobile() 
    {
      return Common.isMobile();
    },      
    ////////////////////////////////
    // Section Helpers
    ////////////////////////////////
    async loadSections()
    {      
      var jotId = this.$store.getters.getCurrentJotId;

      var loaded = await this.$store.dispatch('loadJotsSections', jotId);
      if (loaded.error==null)
      {
        this.showData=true;
        this.$store.commit('setIsLoaded', true);
        this.startAutoSave(Common.DefaultOpsQueuePollingInMS);      
        return true;  
      }
      else
      {
        this.setError(Common.Messages.CouldNotLoad);
        return false;
      }
    },    
    setError(errorMessage)
    {
      this.error = errorMessage;
    },
    resetError()
    {
      this.error="";
    },
    getSectionIdFromRoute()
    {
      var sectionId=undefined;
      if (this.$route.params)
      {
        sectionId = this.$route.params.sectionId;
      }
      return sectionId;
    },
    getJotSectionIdFromRoute()
    {
      var sectionId=undefined;
      if (this.$route.params)
      {
        sectionId = this.$route.params.sectionId;
      }
      return sectionId;
    },    
    getJotIdFromRoute()
    {
      var jotId=undefined;
      if (this.$route.params)
      {
        jotId = this.$route.params.jotId;
      }
      return jotId;
    },    
    showSectionsFromSectionId(sectionId)
    {
      //if sectionId is undefined, then show root section
      if (sectionId)
      {
        //load sections from this starting point
        var sectionsToFilter = (this.$store.getters.sectionsList).sections;
        var section = this.getSectionById(sectionsToFilter, sectionId, true);
        this.setSection(section)
      }
      else
      {        
        //load it from the root
        this.setSection(this.$store.getters.sectionsList);
      } 
    }, 
    getFirstVisibleChild(section)
    {
      // var prior;
      if (section.open && section.sections)
      {
        var children = section.sections;
        var len = children.length;
        for (var i=0; i<len; i++)
        {
          // if (children[i].open)
          {
            return children[i];
          }
          // else
          // {
          // }
        }          
      }

      return null;
    },
    getNextVisibleSection(parentSection, section)
    {
      var below = this.getFirstVisibleChild(section);
      if (below)
      {
        return below;
      }
      below = this.getNextSection(parentSection, section);

      return below;
    },
    getNextSection(parentSection, section)
    {
      var below = this.getNextSectionInSameParent(parentSection, section);
      if (below)
      {
        return below;
      }
      else
      {
        var grandParentSection = this.getSectionById([this.currentMainSection], parentSection.parentSection, false);
        if (grandParentSection)
        {
          var visibleChild = this.getNextSection(grandParentSection, parentSection);
          if (visibleChild)
          {
            below=visibleChild;
          }          
        }

        return below;
      }
    },
    getPriorVisibleSection(parentSection, section)
    {
      var above = this.getPriorSectionInSameParent(parentSection, section);
      if (above==parentSection)
      {
        return above;
      }
      else
      {
        var visibleChild = this.getLastVisibleChild(above);
        if (visibleChild)
        {
          above=visibleChild;
        }
        return above;
      }
    },
    // getFirstVisibleBelow(section)
    // {
    //   // var prior;
    //   if (section.open && section.sections)
    //   {
    //     var children = section.sections;
    //     var len = children.length;
    //     for (var i=len-1; i>=0; i--)
    //     {
    //       if (children[i].open)
    //       {
    //         var visible = this.getLastVisibleChild(children[i]);
    //         if (visible)
    //         {
    //           return visible;
    //         }
    //         else
    //         {
    //           return children[i];  
    //         }
    //       }
    //     }          
    //   }

    //   return null;
    // },    
    getLastVisibleChild(section)
    {
      // var prior;
      if (section.open && section.sections)
      {
        var children = section.sections;
        var len = children.length;
        for (var i=len-1; i>=0; i--)
        {
          if (children[i].open)
          {
            var visible = this.getLastVisibleChild(children[i]);
            if (visible)
            {
              return visible;
            }
            else
            {
              return children[i];  
            }
          }
          else
          {
            return children[i];
          }
        }          
      }

      return null;
    },
    getNextSectionInSameParent(parentSection, section)
    {
      var len = parentSection.sections.length;
      for (var i=0; i< len; i++)
      {
        if (parentSection.sections[i].id == section.id)
        {
          if (i>=(len-1))
          {
            return null; //its the last in the array
          }
          else
          {
            return parentSection.sections[i+1];
          }
        }
        // prior = parentSection.sections[i];
      }

      return null;
    },
    getPriorSectionInSameParent(parentSection, section)
    {
      // var prior;
      for (var i=0; i< parentSection.sections.length; i++)
      {
        if (parentSection.sections[i].id == section.id)
        {
          if (i==0)
          {
            return parentSection; //its the first in the array
          }
          else
          {
            return parentSection.sections[i-1];
          }
        }
        // prior = parentSection.sections[i];
      }

      return null;
    },
    getSectionIndexById(sectionsArray, sectionId)
    {
      for (var i=0; i< sectionsArray.length; i++)
      {
        var thisSection = sectionsArray[i];
        if (thisSection.id===sectionId)
        {
          return i;
        }
      }     
      return -1; 
    },    
    getSectionById(sectionsArray, sectionId, updateBreadCrumb=true)
    {
      for (var i=0; i< sectionsArray.length; i++)
      {
        var thisSection = sectionsArray[i];
        if (thisSection.id===sectionId)
        {
          if (updateBreadCrumb)
          {
            this.pushBreadCrumb(thisSection);  
          }
          
          return thisSection;
        }
        else 
        {
          if (thisSection.sections.length>0)
          {
            var s = this.getSectionById(thisSection.sections, sectionId, updateBreadCrumb);
            if (s)
            {
              if (updateBreadCrumb)
              {
                this.pushBreadCrumb(thisSection);
              }
              return s;
            }
          } 
        }
      }
      return null;      
    },  
    resetBreadCrumbsStack()
    {
      this.breadCrumbs=[];
    },
    crumb(id, text)
    {
        var bc = 
        {
          id: id, 
          text: text
        }
        return bc;
    },
    getNewBreadCrumb(id, text)
    {
      var txt = text;
      if (text.length > Common.MaxBreadCrumbText)
      {
        txt = text.substring(0, Common.MaxBreadCrumbText)+"... ";
      }      

      var bc = this.crumb(id, txt);
      return bc;
    },
    pushBreadCrumb(section)
    {
      var bc = this.getNewBreadCrumb(section.id, section.text);
      this.breadCrumbs.push( bc );
    },    
    setSection(section)
    {      
      this.$store.commit('setCurrentMainSection', section); 
      // this.$store.commit('setCurrentSelection', section.sections); 
    },      
    getDraggedSection(event)
    {
      return (this.currentMainSection.sections[event.newIndex]);
    },  
    dragEnd(event)
    {
      console.log('dragEnd',event);
      var draggedSection = this.getDraggedSection(event);
      var parentSection = this.getSectionById([this.currentMainSection], draggedSection.parentSection, false); 

      // console.log('dragged', draggedSection, parentSection);
      Operations.dragSectionOp(this.$store, 
        draggedSection, 
        parentSection, 
        parentSection, 
        event.newIndex);

      // console.log('finish drag', draggedSection, parentSection, this.currentMainSection, this.currentSelection);
    },
    ////////////////////////////////
    // Save
    ////////////////////////////////    
    saveSections()
    {
      // this.$store.dispatch('saveOperations');
      var self = this;
      Operations.saveOperations(this.$store, function(errors, results)
      {
        if (errors)
        {
          console.log(errors);
          self.setError(Common.Messages.CouldNotSync);
          // this.error="An error occurred syncing data. Please refresh the page.";
        }      
      });
    },
    isSaved()
    {
      if (this.lastSaved.state==true)
      {
        return true;  
      }
      else
      {
        return false;
      }
    },
    resetSave()
    {
      this.lastSaved.text='';  
      this.lastSaved.state=false;  
    },
    saved(isSaved)
    {
      if (isSaved)
      {
        this.lastSaved.text=Common.Messages.Saved;  
        this.lastSaved.state=true;  
      }
      else
      {
        this.lastSaved.text=Common.Messages.NotSaved;  
        this.lastSaved.state=false;  
      }
      
    },
    startAutoSave(timeInMS)
    {
      window.setInterval(() => 
      {
        this.saveSections()
      }, timeInMS);
    },
    ////////////////////////////////
    // Key Monitoring
    ////////////////////////////////     
    jotTitleMonitor(event)
    {
      var title = event.target.innerText;
      this.getJot.title = title;
      Operations.jotTitleChangeOp(this.$store, title);
    },
    keyDownMonitor(event, eventType, section)
    {
      if (eventType==Common.KeyEventTypes.ShiftTab)
      {
        this.moveSectionBackwards(section);
      }
      else if (event.key=='Tab')
      {
        this.moveSectionForwards(section);
      }
      else if (eventType==Common.KeyEventTypes.BackspaceBlankSection)
      {
        this.deleteBlankSection(section);
      }
      else if (eventType==Common.KeyEventTypes.Down)
      {
        this.changeFocusDown(section);
      }
      else if (eventType==Common.KeyEventTypes.Up)
      {
        this.changeFocusUp(section);
      }            
    },
    processEnterKey(event, section, textContent, innerHTML)
    {
      var newSectionInitialValue=null;
      var parentSection = this.getSectionById([this.currentMainSection], this.currentFocusedSection.parentSection, false);  
      var index = this.getSectionIndexById(parentSection.sections, this.currentFocusedSection.id);
      var element = document.getElementById(this.currentFocusedSection.id);
      var caretPosition = TextFormatter.getCaretPosition(element);

      var newSection={};
      var parent ={};
      var toSection={};
      var position =Common.APPEND_SECTION;

      var isAtBeginningOfSection = (caretPosition.caretOffset==0);

      // var curPosition = TextFormatter.currentPosition();
      // var isAtEndingOfSection = ( (caretPosition.range.endContainer.nextSibling==null) && 
      //                             (caretPosition.range.endContainer.textContent.length==caretPosition.caretOffset) ) ||
      //                            (  caretPosition.range.endContainer.nextSibling &&
      //                               caretPosition.range.endContainer.nextSibling.nodeName=="BR" && 
      //                               caretPosition.range.endContainer.nextSibling.nextSibling==null );

      var isAtEndingOfSection = (textContent.trim().length == caretPosition.caretOffset);
      // ( caretPosition.caretOffset==(section.text.length-1) );
      var sectionHasChildren = ( section.sections.length>0) ;

      // console.log('position', isAtEndingOfSection);
      if (isAtBeginningOfSection && textContent.trim()!="")
      {
        //Add section above the current one to this section
        toSection=parentSection.sections;
        parent =parentSection;
        position = index;
        // Operations.addSectionOp(this.$store, parentSection.sections, parentSection, index);
      }
      else if (this.currentFocusedSection.open==false) 
      {
        toSection=parentSection.sections;
        parent =parentSection;
        position = index+1;        
      }
      else if (isAtEndingOfSection && sectionHasChildren)
      {
        toSection=section.sections;
        parent = section;
        position = 0;        
      }
      else if (!isAtEndingOfSection && !isAtBeginningOfSection)
      {
        // console.log(innerHTML);
        // var firstHalfNode = document.createTextNode(textContent);
        // firstHalfNode.innerHTML = innerHTML;
        // var secondHalfNode = document.createTextNode(textContent);
        // secondHalfNode.innerHTML = innerHTML;

        // firstHalfNode.textContent =  "AAAA";//textContent.substring(0, caretPosition.caretOffset);
        // console.log(firstHalfNode.innerHTML, firstHalfNode.textContent);

        var curPosition = TextFormatter.currentPosition();
        var scratchPad = document.getElementById('scratchPad');
        scratchPad.innerHTML="";
        TextFormatter.setFirstHalf(curPosition.node, curPosition.offset, element, scratchPad);
        
        // scratchPad.appendChild(left);
        // console.log(left);
        // var secondHalfNode = TextFormatter.getLatterHalf(curPosition);
        // console.log('processEnterKey', node.textContent);
        // console.log('processEnterKey', section.html, section.text);

        //take the first half, split it out into its own section above the current one
        //use textcontent because the text cannot be committed without moving the caret position
        newSectionInitialValue = scratchPad.innerHTML;
        scratchPad.innerHTML=""; 

        TextFormatter.setSecondHalf(curPosition.node, curPosition.offset, element, scratchPad);     
        // innerHTML.substring(0, caretPosition.caretOffset);
        var finalString = textContent.substring(caretPosition.caretOffset, textContent.length);
        // newSectionInitialValue = textContent.substring(0, caretPosition.caretOffset);
        // var finalString = textContent.substring(caretPosition.caretOffset, textContent.length);

        section.html = scratchPad.innerHTML;//secondHalfNode.textContent;
        section.text = scratchPad.textContent;// secondHalfNode.textContent;
        section.sectionIsDeleted=false;
        scratchPad.innerHTML=""; 

        document.getElementById(section.id).focus();
        toSection=parentSection.sections;
        parent = parentSection;
        position = index;          
      }
      else if (this.currentFocusedSectionDepth==0)
      {
        console.log('4');
      
        // newSection = this.addSection(this.currentSelection, this.currentMainSection, index+1);
        toSection=this.currentMainSection.sections;
        parent =this.currentMainSection;
        position = index+1;
        // Operations.addSectionOp(this.$store, this.currentSelection, this.currentMainSection, index+1);   
      }
      else if ( (this.currentFocusedSection.open==false) || 
                (this.currentFocusedSectionDepth>0 && section.sections.length==0) )
      {
        //if the section has no children, add a new node at the same level
        toSection=parentSection.sections;
        parent =parentSection;
        position = index+1;

        // newSection = this.addSection(parentSection.sections, parentSection, position);
        // Operations.addSectionOp(this.$store, parentSection.sections, parentSection, index+1);   
      }
      else if (section.sections.length>0)
      {
        //if the section has children, add to the current children
        // newSection = this.addSection(section.sections, section, index+1);
        // Operations.addSectionOp(this.$store, section.sections, section, index+1);  
        toSection=section.sections;
        parent =section;
        // position = index+1;
        position = 0        
      }
      else
      {
        return;
      }

      newSection = this.addSection(toSection, parent, position);
      // console.log(initialValue);
      if (newSectionInitialValue)
      {
        newSection.text = newSectionInitialValue;//firstHalfNode.textContent;
        newSection.html = newSectionInitialValue;//firstHalfNode.innerHTML;
      }            
      Operations.addSectionOp(this.$store, newSection, parent, position);


      Vue.nextTick(() => { 
        document.getElementById(newSection.id).focus();
        if (newSectionInitialValue)
        {
          document.getElementById(section.id).focus();
        }            
      });       
    },
    keyMonitor(event, section) 
    {
      this.resetSave();

      if (event.key==Common.Key_Enter)
      {
        // this.processEnterKey(section);
      }      
    },
    ///////////////////////////////
    // OPERATIONS
    ///////////////////////////////
    changeFocusDown(section)
    {
      var parentSection = this.getSectionById([this.currentMainSection], section.parentSection, false);

      var below = this.getNextVisibleSection(parentSection, section);
      if (below)
      {
        Vue.nextTick(() => {
          document.getElementById(below.id).focus();
        });         
      }
    },    
    changeFocusUp(section)
    {
      var parentSection = this.getSectionById([this.currentMainSection], section.parentSection, false);

      var above = this.getPriorVisibleSection(parentSection, section);
      if (above)
      {
        Vue.nextTick(() => {
          document.getElementById(above.id).focus();
        });         
      }
    },
    addNewSection()
    {
      // this.addSection(this.currentSelection, this.currentMainSection);
      var newSection  = this.addSection(this.currentMainSection.sections, this.currentMainSection, Common.APPEND_SECTION);
      Operations.addSectionOp(this.$store, newSection, this.currentMainSection, Common.APPEND_SECTION);

      Vue.nextTick(() => { 
        document.getElementById(newSection.id).focus();
      });        

    },    
    moveSectionForwards(section)
    {
      var parentSection = this.getSectionById([this.currentMainSection], section.parentSection, false);
      var priorSection = this.getPriorSectionInSameParent(parentSection, section);

      if (parentSection.id==priorSection.id)
      {
        return;
      }
      else
      {
        Operations.moveSectionOps(this.$store, section, parentSection, priorSection);
      }
    },    
    moveSectionBackwards(section)
    {     
      var fromParent = this.getSectionById([this.currentMainSection], section.parentSection, false);          
      var toParent = this.getSectionById([this.currentMainSection], fromParent.parentSection, false); 
      var fromParentIndex = this.getSectionIndexById(toParent.sections, fromParent.id);
      if (fromParent!=undefined && toParent!=undefined)
      {
        // console.log( toParent, fromParent, (fromParentIndex+1));
        Operations.moveSectionOps(this.$store, section, fromParent, toParent, (fromParentIndex+1));
      }         
    },    
    deleteBlankSection(sectionToDelete)
    {
      if (sectionToDelete.sections.length==0)
      {
        var parentSection = this.getSectionById([this.currentMainSection], sectionToDelete.parentSection, false); 
        var priorSection = this.getPriorVisibleSection(parentSection, sectionToDelete);

        Operations.removeSectionOp(this.$store, sectionToDelete, parentSection);

        //move to end of last section
        var element = document.getElementById(priorSection.id);
        Common.sleep(5).then(() => 
        {
          Common.setEndOfContenteditable(element); 
        });        
      }
    },
    deleteJot(callback)
    {
      var url = Common.URLS.DeleteJot + this.currentJotId;
      Comms.delete(url, callback);
    },
    //Identiy which section is in focus and it's depth
    sectionInFocus(event, section, depth)
    {  
      this.$store.commit('setSectionInFocus', section.id);
      this.currentFocusedSection=section;
      this.currentFocusedSectionDepth=depth;
    },
    sectionBlurred(event, section, depth)
    {
      this.resetSave();
      this.currentFocusedSection={};
      this.currentFocusedSectionDepth=0;
    },
    sectionSelected(event, sectionId)
    {
    }
    ,
    getNewSectionId()
    {
        var id = uuid.v4();
        return id;
    },
    addSection(currentSection, parentSection, atIndex)
    {     

      var sectionId = this.getNewSectionId();
      var priorId = undefined;
      var initial = Common.InitialSectionHtml;

      var item = {id: sectionId, 
                  documentId: this.getJot.documentId,
                  text: ' ', 
                  html: '</br>', 
                  open: true, 
                  priorId: undefined, 
                  parentSection: parentSection.id, 
                  sections:[]};  

      if (atIndex>Common.APPEND_SECTION)
      {
        currentSection.splice(atIndex, 0, item);
        // Vue.set(currentSection, atIndex, item)
      }
      else
      {
        currentSection.push(item);  
      }

      return item;
    },    
  }

}

</script>

<style>
[contenteditable]:focus {
    outline: 0px solid transparent;    
}


/* Enter and leave animations can use different */
/* durations and timing functions.              */
.slide-fade-enter-active {
  transition: all .3s ease;
}
.slide-fade-leave-active {
  transition: all .1s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ 
{
  transform: translateY(50px);
  opacity: 0;
}


.list-item {  
  line-height: 2;
}
.list-enter-active
{
  transition: all 0.3s;
}
.list-leave-active {
  transition: all 0.1s;
}

.list-enter
{
  opacity: 0;  
  color:blue;
}

.list-leave-to /* .list-leave-active below version 2.1.8 */ {
  opacity: 0;  
}

.flip-list-move {
  transition: transform 1s;
}
</style>

</style>
