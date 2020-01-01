<template>
<div>
    <h4><b>Jot Dot</b></h4><br>
    <amplify-authenticator></amplify-authenticator>
</div>

</template>

<script>
import { Auth } from 'aws-amplify';
import { AmplifyEventBus } from 'aws-amplify-vue';
import AuthHelper from '../AuthHelper.vue';
import Common from '../Common.js';

export default 
{
  name: 'Login',
  props: {
  },
  computed: {
  },  
  async beforeCreate() 
  {
    try 
    {
      const user = await Auth.currentAuthenticatedUser();
      Common.GoToJots(this.$router);
      // this.$router.push({name:'notes'});
    } 
    catch (err) 
    {
      console.log(err);
    }
    
    AmplifyEventBus.$on('authState', info => 
    {
      if (info === 'signedIn') 
      {
        AuthHelper.updateSignInStatus(this.$store);
        Common.GoToJots(this.$router);
        // this.$router.push({name:'notes'})
      } 
    });
  },  
  methods: 
  {
         
  },
  data() { 
    return {
      maxSize:5
    }
  }

}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
</style>
