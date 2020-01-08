<template>
  <div id="app">
    <NavMenu v-if="isSignedIn" />
    <b-container>
      <div class="col-lg-11 main ml-5 mr-5 mb-5">      
        <router-view :key="$route.fullPath"></router-view>
      </div>
  </b-container>
  </div>
</template>

<script>
import AuthHelper from './AuthHelper.vue';
import NavMenu from './components/NavMenu.vue';
import Sidebar from './components/Sidebar.vue';
import Common from './Common.js';
import Editor from '@tinymce/tinymce-vue';

export default 
{
  name: 'app',
  components: 
  {
    NavMenu,
    Sidebar
  },
  async beforeCreate() 
  {
    await AuthHelper.updateSignInStatus(this.$store);
    if (this.$store.state.signedIn === true) 
    {
      Common.GoToJots(this.$router);
    }
    else 
    {
      Common.GoToSignIn(this.$router);
    }    
  },    
  computed: 
  {
    isSignedIn()
    {
      return this.$store.state.signedIn;
    }
  },
  methods:
  {
  },
  data: () => (
  {
    searchText:"AA"  
  })
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.dragClass
{
  border-top: 1px dashed grey;
}

.main
{
  margin-top: 20px;
}
.main_container
{
  margin: 20px 0 0;  
  margin-left: auto;
}

</style>






