<template>
<div>
  <b-dropdown id="dropdown-right" right text="Jot Options" size="sm" variant="outline-primary text">
    <!--b-dropdown-item href="#" v-on:click="toggleTags()" >{{hashTagSearch}}</b-dropdown-item-->
    <b-dropdown-item href="#" v-on:click="togglePrint()"><span class="subtitle">{{toggleText}}</span></b-dropdown-item>
    <b-dropdown-divider></b-dropdown-divider>
    <b-dropdown-item href="#" v-on:click="deleteJot()"><span class="text-danger subtitle">{{deleteText}}</span></b-dropdown-item>
  </b-dropdown>

    <!--div>
    <b-button variant="outline-primary text" size="sm" v-on:click="toggleTags()" >
      <font-awesome-icon size="sm" icon="hashtag"/>  
    </b-button>     
    <b-button variant="outline-primary text" size="sm" v-on:click="togglePrint()" class="ml-2">
      <font-awesome-icon size="sm" icon="print""/> {{toggleText}}
    </b-button>
    <b-button variant="outline-danger text" size="sm" v-on:click="deleteJot()" class="ml-2">
      <font-awesome-icon size="sm" icon="trash-alt""/>  
    </b-button> 
  </div-->
</div>


</template>

<script>
import Common from '../Common.js';

export default 
{
  name: 'Jots_Menu',
  props: {
  },
  computed: {

  },  
  methods: 
  {
    toggleTags()
    {
      this.$emit('toggle-tags', event);
    },
    togglePrint()
    {
      this.$emit('toggle-print', event);
      this.showPrintMode= !this.showPrintMode;    
      if (this.showPrintMode)
      {
        this.toggleText = Common.Messages.PrintMode;
      }
      else
      {
        this.toggleText =Common.Messages.EditMode;
      }      
    },
    deleteJot()
    {
      this.$emit('delete-jot', event);
    },    
  },
  data() { 
    return {
      toggleText: Common.Messages.PrintMode,
      hashTagSearch: Common.Messages.TagSearch,
      deleteText: Common.Messages.DeleteJot,
      showPrintMode:true
    }
  }

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
