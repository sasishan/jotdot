<template>
  <div id="app">
    <NavMenu :signedIn="isSignedIn" />
    <br>
    <b-container class="main_container">
      <div class="col-lg-12 main mb-5">      
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
    // console.log('beforeCreate app');
    await AuthHelper.updateSignInStatus(this.$store);
    // console.log('beforeCreate updateSignInStatus');
    if (this.$store.state.signedIn === false) 
    {
      // Common.GoToJots(this.$router, this.$store.state.signedIn);
    }
    // else 
    // {
    //   // Common.GoToSignIn(this.$router);
    // }    
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
#app_Backup {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 14px;
  font-weight:400;
}

#app{
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Fira Sans","Droid Sans","Helvetica Neue",sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 14px;
  font-weight:400;
}

table, th, td  {
    border-spacing: 2px;
    border: 1px solid grey;
}

.dragClass
{
  border-top: 1px dashed grey;
}

.main_container
{
  padding-top: 20px;
}

.ghostClass
{
  opacity:0;
}
.main
{
  margin-top: 40px;
}


</style>






