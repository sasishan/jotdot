<template>
<div >
  <span v-if="errorOccurred===true">
    <h6 class="text-danger mt-5">{{error}}</h6>
  </span>
  <span v-if="isLoaded===false && errorOccurred!=true">
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
      <h5 class="title mb-n1">
      <span class="float-right permissions-text">{{getJotPermissions(jot)}}</span>
        {{jot.title}}         
      </h5>
      <span class="subtitle">{{jot.eId}}</span>
      <span class="float-right lastUpdated-subtitle">
        {{ jot.lastUpdated | moment("calendar") }}
      </span>
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
import AuthHelper from '../AuthHelper.vue';


export default 
{
  name: 'Jots',
  props: {
  },
  components: 
  {
  },  
  computed: {
    jotsList()
    {
      var jotList = this.$store.getters.getJotsList;
      jotList.sort(this.compare);
      return jotList;
    },
    loadingMessage()
    {
      return Common.Messages.Loading;
    },    
    isLoaded()
    {
      return this.jotsLoaded;
    },
    errorOccurred()
    {
      if (this.error=="")
      {
        return false;
      }
      return true;
    },    
  },  
  async beforeCreate() 
  {
    // console.log('beforeCreate app');
    await AuthHelper.updateSignInStatus(this.$store);
    // console.log('beforeCreate updateSignInStatus');
    if (this.$store.state.signedIn === false) 
    {
      Common.GoToJots(this.$router, this.$store.state.signedIn);
    }
    // else 
    // {
    //   // Common.GoToSignIn(this.$router);
    // }    
  },   
  async mounted()
  {
    Comms.wsEmit(this.$socket, Common.WSTypes.Connect, { }); 
    // Comms.wsEmit(this.$socket, Common.WSTypes.NoJot, { });    
    this.$store.commit('clearStoredData');
    var response = await this.loadJots();
    if (response.error)
    {
      this.setError(Common.Messages.CouldNotReachServer);
    }
    else
    {
      this.jotsLoaded= true;
    }
  },
  methods: 
  {

    setError(errorMessage)
    {
      this.error = errorMessage;
    },
    resetError()
    {
      this.error="";
    },
    openJot(jot)
    { 
      this.$router.push({name:'jotsById',  params: { jotId: jot.documentId } });
    },
    async loadJots()
    {
      var loadError=null;
      // await this.$store.dispatch('loadJots');
      var url = Common.URLS.Documents;
      var item = await Comms.get(url).catch((error) => 
      { 
        loadError = error;
      });

      if (loadError)
      {
        return {error: loadError, jots: null};
      }

      if (item)
      {
        this.$store.commit('initializeJots',  item);
        return {error: null, jots: item};
      }
    },
    getJotPermissions(jot)
    {
      var permissionsText= Common.getJotPermissions(jot);
      
      return permissionsText;
    },
    ///////////////////////////////
    // OPERATIONS
    ///////////////////////////////   
    async createJot()
    {
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
    },
    compare(a,b) 
    {
      if (a[this.compareAttribute] < b[this.compareAttribute])
      {
         return 1;
      }

      if (a[this.compareAttribute] > b[this.compareAttribute])
      {
        return -1;
      }
        
      return 0;
    }    
  },
  data() { 
    return {
      error: '',
      jotsLoaded:false,
      compareAttribute:'lastUpdated'
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

.permissions-text
{
  text-align: right;
  font-size: 0.6em;
  color: red;
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
