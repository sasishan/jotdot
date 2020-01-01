<template>
  <span>  
  <br><br>
  <span v-if="errorOccurred===true">
    <h6 class="text-danger mt-5">{{error}}</h6>
  </span>
  <span v-if="isLoaded===false && errorOccurred===false">
    {{loadingMessage}} <font-awesome-icon size="lg" icon="spinner" class="fa-spin" />
  </span>
  <span v-if="isLoaded===true">
    <div class="float-right">
      <b-button variant="outline-primary text" size="sm" v-on:click="toggleTags()" >
        <font-awesome-icon size="sm" icon="hashtag"/>  {{hashTagSearch}}
      </b-button>       
      <b-button variant="outline-primary text" size="sm" v-on:click="togglePrint()" class="ml-2">
      <font-awesome-icon size="sm" icon="print""/>  {{toggleText}}
      </b-button>          
    </div>  
  </span>  
  <span v-if="isLoaded===true && showTags==false"> 
    <Notes_Breadcrumb :sectionsStack="breadCrumbs" :jot="getJot" :allowEdit=allowEdit class="mt-3"/>
    <transition name="slide-fade" mode="out-in" >
      <h4 v-if="isSwitched==true" :contenteditable=allowEdit v-html="currentMainSection.text" class="mt-2"></h4>
      <h4 v-if="isSwitched==false && currentMainSection.sectionId=='-1'" :contenteditable=allowEdit v-html="getJot.title"  class="mt-2" @blur="jotTitleMonitor"></h4>      
      <h4 v-if="isSwitched==false && currentMainSection.sectionId!='-1'" :contenteditable=allowEdit v-html="currentMainSection.text" class="mt-2"></h4>      
    </transition>
    <transition-group name="list" tag="p" mode="out-in" v-if="isMobile() || !allowEdit">
      <Notes_Section v-for="(section, index) in currentSelection" 
        :key="index" 
        :allowEdit=allowEdit 
        :haveWritePermissions=haveDocWritePermissions
        :section="section" 
        :depth="0" 
        :searchText='searchText'
        v-if="isLoaded==true"
        class="list-item"
        @section-in-focus="sectionInFocus"
        @section-in-blur="sectionBlurred"
        @section-selected="sectionSelected"
        @special-key-pressed="keyMonitor" 
        @special-key-down-pressed="keyDownMonitor"
        @save-section="saveSections"
        />
    </transition-group>
    <draggable v-model="currentSelection" @end="dragEnd" v-if="!isMobile() && allowEdit">
      <transition-group name="list" tag="p" mode="out-in">
        <Notes_Section v-for="(section, index) in currentSelection" 
          :key="index" 
          :section="section" 
          :depth="0" 
          v-if="isLoaded==true" 
          :allowEdit=allowEdit
          :haveWritePermissions=haveDocWritePermissions
          :searchText='searchText'
          class="list-item"
          @section-in-focus="sectionInFocus"
          @section-in-blur="sectionBlurred"
          @section-selected="sectionSelected"
          @special-key-pressed="keyMonitor" 
          @special-key-down-pressed="keyDownMonitor"
          @save-section="saveSections"
          />
      </transition-group>
    </draggable>

    <br>
    <Notes_Add style="float:left" @add-section-click="addNewSection" v-if="haveDocWritePermissions && allowEdit && isLoaded==true" />  
  </span>
  <span v-if="showTags==true">
    <Notes_Tags />
  </span>
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
import { Auth } from 'aws-amplify';
import draggable from 'vuedraggable';
import OpsConfig from '../OperationsConfig.js';
import Common from '../Common.js';

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
    }
  },  
  props: {
    id: String,
    msg: String,
    search: ""
  },  
  components: 
  {
    Notes_Section,
    Notes_Breadcrumb,
    Notes_Add,
    draggable,
    NavMenu,
    Notes_Tags
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
    sectionsList()
    {
      return this.currentSelection;
      // return this.$store.getters.getCurrentSelection;
    },
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
    currentSelection:
    {
      get() 
      {
          return this.$store.getters.getCurrentSelection;
      },
      // need this mutation for dragging
      set(section) 
      {
          this.$store.commit('setCurrentSelection', section);
          this.$store.commit('setParentsCurrentSelection', section);
      }
    }
  },    
  methods: 
  {
    ////////////////////////////////
    // Initialize
    ////////////////////////////////
    async initializeStartingJotId()
    {
      var jotId = this.getJotIdFromRoute();      
      if (jotId)
      {
        if (this.$store.getters.getCurrentJotId!=jotId)
        {
          this.$store.commit('clearStoredData');
          this.$store.commit('setCurrentJotId', jotId);
          var jot = await this.$store.dispatch('getOneJot', jotId);
        }
      }
      else
      {
        this.setError();
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
        if (this.$store.getters.getOpsQueue.length>0) {
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
      if (this.allowEdit)
      {
        this.toggleText = Common.Messages.PrintMode;
      }
      else
      {
        this.toggleText =Common.Messages.EditMode;
      }
    },
    isMobile() 
    {
      if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) 
      {
        return true
      } 
      else 
      {
        return false
      }
    },      
    ////////////////////////////////
    // Section Helpers
    ////////////////////////////////
    async loadSections()
    {      
      var loaded = await this.$store.dispatch('loadSection');
      if (loaded)
      {
        this.showData=true;
        this.$store.commit('setIsLoaded', true);
        this.startAutoSave(Common.DefaultOpsQueuePollingInMS);      
        return true;  
      }
      else
      {
        this.setError();
        return false;
      }
    },    
    setError()
    {
      this.error = Common.Messages.CouldNotLoad;
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
    getPriorSection(parentSection, section)
    {
      var prior;
      for (var i=0; i< parentSection.sections.length; i++)
      {
        
        // console.log('getPriorSection', prior);
        if (parentSection.sections[i].id == section.id)
        {
          if (prior && prior.id!=section.id)
          {
            return prior;
          }
          else
          {
            return parentSection; //its the first in the array
          }
        }
        prior = parentSection.sections[i];
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
      this.$store.commit('setCurrentSelection', section.sections); 
    },      
    dragEnd(event)
    {
      this.$store.commit('queueOpItem', {type: 'drag', section: this.section}); 
      this.$store.commit('dragSections', {sections: this.currentSelection, oldIndex: event.oldIndex, newIndex: event.newIndex} );
    },
    ////////////////////////////////
    // Save
    ////////////////////////////////    
    saveSections()
    {
      // this.$store.dispatch('saveOperations');
      Operations.saveOperations(this.$store);
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
    },
    processEnterKey(section)
    {
      var parentSection = this.getSectionById([this.currentMainSection], this.currentFocusedSection.parentSection, false);  
      var index = this.getSectionIndexById(parentSection.sections, this.currentFocusedSection.id);
      var element = document.getElementById(this.currentFocusedSection.id);
      var caretPosition = getCaretPosition(element);

      var newSection={};

      if (caretPosition==0)
      {
        newSection = Operations.addSectionOp(this.$store, parentSection.sections, parentSection, index);
      }
      else if (this.currentFocusedSectionDepth==0)
      {
        newSection = Operations.addSectionOp(this.$store, this.currentSelection, this.currentMainSection, index+1);   
      }
      else if ( (this.currentFocusedSection.open==false) || 
                (this.currentFocusedSectionDepth>0 && section.sections.length==0) )
      {
        //if the section has no children, add a new node at the same level
        newSection= Operations.addSectionOp(this.$store, parentSection.sections, parentSection, index+1);   
      }
      else if (section.sections.length>0)
      {
        //if the section has children, add to the current children
        newSection= Operations.addSectionOp(this.$store, section.sections, section, index+1);  
      }

      Vue.nextTick(() => { 
        document.getElementById(newSection.id).focus();
      });       
    },
    keyMonitor(event, section) 
    {
      this.resetSave();

      if (event.key=="Enter")
      {
        this.processEnterKey(section);
      }      
    },
    ///////////////////////////////
    // OPERATIONS
    ///////////////////////////////
    addNewSection()
    {
      // this.addSection(this.currentSelection, this.currentMainSection);
      var newSection = Operations.addSectionOp(this.$store, this.currentSelection, this.currentMainSection);

      Vue.nextTick(() => { 
        document.getElementById(newSection.id).focus();
      });        

    },    
    moveSectionForwards(section)
    {
      var parentSection = this.getSectionById([this.currentMainSection], section.parentSection, false);
      var priorSection = this.getPriorSection(parentSection, section);

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
      var parentSection = this.getSectionById([this.currentMainSection], section.parentSection, false);          
      var grandParentSection = this.getSectionById([this.currentMainSection], parentSection.parentSection, false); 

      if (parentSection!=undefined && grandParentSection!=undefined)
      {
        Operations.moveSectionOps(this.$store, section, parentSection, grandParentSection);
      }         
    },    
    deleteBlankSection(sectionToDelete)
    {
      if (sectionToDelete.sections.length==0)
      {
        var parentSection = this.getSectionById([this.currentMainSection], sectionToDelete.parentSection, false); 
        var priorSection = this.getPriorSection(parentSection, sectionToDelete);

        Operations.removeSectionOp(this.$store, sectionToDelete, parentSection);

        //move to end of last section
        var element = document.getElementById(priorSection.id);
        Common.sleep(5).then(() => 
        {
          Common.setEndOfContenteditable(element); 
        });        
      }
    },
    //Identiy which section is in focus and it's depth
    sectionInFocus(event, section, depth)
    {  
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
