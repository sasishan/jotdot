<template>
  <div>
    <!--amplify-sign-out></amplify-sign-out--> 
    <b-button type="submit" variant="success" v-on:click="signOut">Sign Out</b-button>
  </div>
</template>

<script>
import { Auth } from 'aws-amplify'
import AuthHelper from '../AuthHelper.vue'

export default 
{
  name: 'Signout',
  props: {
    msg: String
  },
  computed: {
    validation() 
    {
      return this.email.length > 4;
    }
  },  
  methods: 
  {
    async signOut()
    {
      console.log('Signed out');
      try 
      {
        const user = await Auth.signOut();
        this.$store.dispatch('clearStore');
        AuthHelper.updateSignInStatus(this.$store);
        this.$router.push('/Signin');
      } 
      catch (err) 
      {
        console.log(err);
      }      
    }   
  }
}

</script>