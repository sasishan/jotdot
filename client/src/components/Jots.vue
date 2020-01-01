<template>
<div class="container">
  <span v-if="isLoaded===false">
    {{loadingMessage}} <font-awesome-icon size="lg" icon="spinner" class="fa-spin" />
  </span>
  <span v-if="isLoaded===true">
    <div class="float-right">
      <b-button variant="outline-primary text" size="sm" @click="createJot()" >
        <font-awesome-icon size="sm" class="mr-2" icon="edit"/>New Jot
      </b-button>       
    </div> 
    <br><br>
    <div v-for="(jot, index) in jotsList" class="jotRecord" @click="openJot(jot)">
      <h5 class="title mb-n1">{{jot.title}}</h5>
      <span class="subtitle">{{jot.eId}}</span>
      <span class="float-right subtitle">{{ jot.lastUpdated | moment("calendar") }}</span>
      <hr>
    </div>       
  </span>
</div>
</template>

<script>
import Common from '../Common.js';
import Comms from '../components/Comms.vue';
import Operations from './Operations.vue';
import moment from 'moment';

export default 
{
  name: 'Jots',
  props: {
  },
  computed: {
    jotsList()
    {
      return this.$store.getters.getJotsList;
    },
    loadingMessage()
    {
      return Common.Messages.Loading;
    },    
    isLoaded()
    {
      return this.jotsLoaded;
    },
  },  
  async mounted()
  {
    this.$store.commit('clearStoredData');
    await this.loadJots();
    this.jotsLoaded=true;
  },
  methods: 
  {
    openJot(jot)
    { 
      this.$router.push({name:'jotsById',  params: { jotId: jot.documentId } });
    },
    async loadJots()
    {
      await this.$store.dispatch('loadJots');
    },
    ///////////////////////////////
    // OPERATIONS
    ///////////////////////////////   
    async createJot()
    {
      console.log('createjot');
      var url = Common.URLS.CreateJot;
      var newJot = await Comms.post(url, {});

      if (newJot)
      {
        this.openJot(newJot);
      }
      else
      {
        console.log(error);
      }
    }
  },
  data() { 
    return {
      jotsLoaded:false
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
