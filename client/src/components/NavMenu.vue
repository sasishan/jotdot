<template>
  <b-navbar toggleable="xl" type="light" variant="light" fixed="top">
    <b-navbar-brand href="#">
    <font-awesome-icon size="sm" icon="arrow-circle-right" :style="{ color: 'grey' }"  />
    	{{getAppName()}}
	</b-navbar-brand>
    <b-navbar-toggle target="nav-collapse">	    
    </b-navbar-toggle>
    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav>
        <b-nav-item to='/jots'>Jots</b-nav-item>
        <b-nav-item to='/about'>About</b-nav-item>
      </b-navbar-nav>
      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
      	<Search />
        <b-nav-item-dropdown right>
          <!-- Using 'button-content' slot -->
          <template slot="button-content">
          	<em><font-awesome-icon size="lg" icon="cog"/></em>
      	  </template>
          <b-dropdown-item href="#">{{getUserName()}}</b-dropdown-item>
          <b-dropdown-item href="#"><Signout/></b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>	
</template>

<script>
import Signout from '.././components/Signout.vue';
import Common from '../Common.js';
import Search from '.././components/Search.vue';
import AuthHelper from '../AuthHelper.vue'

export default {
	name: 'NavMenu',  
	computed:
	{
		isSignedIn()
		{
		  return this.$store.state.signedIn;
		}		
	},
	methods:
	{
		getAppName()
		{
			return Common.AppName;
		},
		getUserName()
		{
			// return "test";
	      return this.$store.getters.getUsername;
		},
	},
	components: 
	{
		AuthHelper, 
		Signout, 
		Search,
	}	
}
</script>