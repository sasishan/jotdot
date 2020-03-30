<template>
<div>

    <b-button variant="outline-primary text" size="sm" v-on:click="showShareMenu()" >
      {{shareText}}
    </b-button>     
    <div>
      <b-modal id="shareModal" 
        title="Share Jot" 
        @show="resetModalText" 
        @ok="handleDone" 
        @close= "handleCancelShare"
        @cancel= "handleCancelShare" 
        okTitle="Done" buttonSize='sm'
        no-stacking>        
       <!-- <label for="tags-basic"><b>Add Emails</b></label>     
        <b-form-input v-model="modalText"></b-form-input>      
        <hr> -->
        <b>Shareable Link</b>
        <p>
        {{getShareableLinkStatus()}}
        </p>
        <toggle-button v-model="shareableLink" @change="shareToggle" />
        <b-input-group v-if="shareableLink">
          <b-form-input :value="getJotShareableLink()" disabled >AAA</b-form-input>   
          <b-input-group-append>
            <b-button size="sm"  variant="outline-primary" v-clipboard:copy="getJotShareableLink()">Copy</b-button>
          </b-input-group-append> 
        </b-input-group>
        <br>
        <hr>
        <b>Make Link Public</b>
        <p>
        {{getPublicLinkStatus()}}
        </p>
        <toggle-button v-model="publicLink" @change="publicToggle" />
        <br>        
      </b-modal>
    </div>     
  </div-->
</div>


</template>

<script>
import Common from '../Common.js';
import { ToggleButton } from 'vue-js-toggle-button';

export default 
{
  name: 'ShareMenu',
  components:
  {
    ToggleButton
  },
  props: {
    jot: {}
  },
  data() 
  { 
    return {
      shareText: Common.Messages.ShareText,
      modalText: {},
      shareableLink: false,
      publicLink: false,
      isPublic: false,
      // jotShareableLink: 
    }
  },  
  mounted()
  {
    this.setShareableState();
    // this.setPublicState();
  },
  computed: {
    isSignedIn()
    {
      return this.$store.state.signedIn;
    },
  },  
  methods: 
  {
    setShareableState()
    {
      if (this.jot && this.jot.isShared)
      {
        this.shareableLink=true;
      }
    },
    setPublicState()
    {
      if (this.jot && this.jot.isShared)
      {
        this.publicLink=true;
      }
    },    
    getJotShareableLink()
    {
      // console.log('getShareLink', this.jotId, Common.GetJotLink(this.jotId));
      return Common.GetJotLink(this.jot.documentId);
    },     
    getPublicLinkState()
    {
      return publicLink;
    },
    shareToggle()
    {
      this.$emit('toggle-shareable', this.shareableLink);
    },
    publicToggle()
    {
      this.$emit('toggle-public', this.publicLink);
    },    
    getShareableLinkStatus()
    {
      if (this.shareableLink)
      {
        return "Link sharing is ON. Anyone with the URL below can access this document.";
      }
      else
      {
        return "Link sharing is off, so only members with permissions can access this document through its URL.";
      }
    },
    getPublicLinkStatus()
    {
      if (this.publicLink)
      {
        return "Link is published to the PUBLIC.";
      }
      else
      {
        return "Link is NOT published to the public.";
      }
    },    

    //////////////////////////
    //Modals
    //////////////////////////
    getShareModalText()
    {
      return Common.Messages.ConfirmDeleteModalText;
    },    
    resetModalText()
    {
      this.modalText="";      
    },
    handleCancelShare()
    {
  //    this.showModalCancelled(Common.Messages.DeleteCancelledMessage);
    },
    handleDone()
    {
      var self = this;
      try
      {
        
      }
      catch(e)
      {
        // this.showModalCancelled(Common.Messages.DeleteErrorMessage);
        return;
      }
    },
    showModalCancelled(message) 
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
    showShareMenu()
    {
      this.$bvModal.show('shareModal');
    },    
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.title
{
}

.jotRecord
{
  cursor:pointer; 
}

.lastUpdated-subtitle
{
  text-align: right;
  font-size: 0.7em;
}
.subtitle
{

  font-size: 0.8em;
}
.container
{
  padding-top: 70px;
}

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
