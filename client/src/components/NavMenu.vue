<template>
<div>
  <b-navbar toggleable="xl" type="light" variant="light" fixed="top">
    <b-navbar-brand href="#">
    <font-awesome-icon size="sm" icon="arrow-circle-right" :style="{ color: 'grey' }"  />
    	{{getAppName()}}
	</b-navbar-brand>
    <b-navbar-toggle target="nav-collapse">	    
    </b-navbar-toggle>
    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav>
        <b-nav-item @click="home" >Home</b-nav-item>
        <b-nav-item to='/tags' v-if="signedIn">Tags</b-nav-item>
        <!--b-nav-item to='/test'>Test Area</b-nav-item-->
        <b-nav-item to='/about'>About</b-nav-item>
      </b-navbar-nav>
      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
      	<Search v-if="signedIn"/>
      	<b-button type="submit" variant="default" v-on:click="signIn" v-if="!signedIn">Sign In</b-button>
        <b-nav-item-dropdown right v-if="signedIn">
          <!-- Using 'button-content' slot -->
          <template slot="button-content">
          	<em><font-awesome-icon size="lg" icon="cog"/></em>
      	  </template>
          <b-dropdown-item href="#">{{getUserName()}}</b-dropdown-item>
          <b-dropdown-item href="#" v-if="signedIn"><Signout/></b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>	
</div>
</template>

<script>
import Signout from '.././components/Signout.vue';
import Common from '../Common.js';
import Search from '.././components/Search.vue';
import AuthHelper from '../AuthHelper.vue'

export default {
	name: 'NavMenu',  
	props:
	{
		signedIn:{}
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
	    isMobile() 
	    {
	      return Common.isMobile();
	    },  		
		getAppName()
		{
			return Common.AppName;
		},
		getUserName()
		{
			// return "test";
	      return this.$store.getters.getUsername;
		},
		home()
		{
			Common.GoToJots(this.$router, this.isSignedIn);
		},
		signIn()
		{
			Common.GoToSignIn(this.$router);
		}
	},
	components: 
	{
		AuthHelper, 
		Signout, 
		Search,
	}	
}
</script>