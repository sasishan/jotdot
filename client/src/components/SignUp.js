<template>
  <v-container
    class="fill-height"
    fluid>    
     <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="4">
          <v-card class="elevation-2  ">
            <v-toolbar color="primary" dark flat>
              <v-toolbar-title>Sign Up</v-toolbar-title>     
              <div class="flex-grow-1"></div>   
            </v-toolbar>                  
            <v-card-text>
              <v-form>
                <v-text-field
                  label="Your email"
                  v-model="form.login"
                  type="text"></v-text-field>

                <v-text-field
                  id="Your Password"
                  label="Password"
                  v-model="form.password"
                  type="password" ></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <div class="flex-grow-1"></div>
              <v-btn color="primary" @click="signUp">Submit</v-btn>              
            </v-card-actions>

            <p class="red--text ml-1 pa-3" v-if="errorExists">{{error.message}}</p>
          </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import { Auth } from 'aws-amplify'
import { AmplifyEventBus } from 'aws-amplify-vue';
import Comms from './Comms';
import { URLS } from '../config.js';

export default 
{
  name: 'SignUp',
  data: () => (
  {  
    form: {
        login: '',
        password: ''
      },
    error:{},
    errorExists:false
  }),
  components: 
  {

  },
  methods:
  {
    async registerUser(username, id, callback)
    {
      var person = 
      {
        username: username,
        userId: id
      };

      var url = URLS.RegisterNewUser;      
      Comms.anonymousPost(url, person, function (error, result)
      {
        if (error)
        {
          console.log(error);
          return callback(error, null);
        }
        console.log('Person registered');
        return callback(null, result);
      });   
    },      
    clearError()
    {
      this.error = {};
      this.errorExists=false;
    },
    setError(error)
    {
      this.error = error;
      this.errorExists=true;
    },    
    signUp()
    {
      this.clearError();  
      let user = {
        attributes: {},
      };

      const { login, password } = this.form;
      user.username = login;
      user.password = password;

      var vm = this;
      this.$Amplify.Auth.signUp(user)
        .then(data => {
          AmplifyEventBus.$emit('localUser', data);
          
          console.log(data);
          this.registerUser(data.user.username, data.userSub , function(error, result)
          {
            if (error)
            {
              console.log(error);
            }

            if (data.userConfirmed === false)
            {
              AmplifyEventBus.$emit('authState', 'confirmSignUp');
              return vm.$emit('authState', 'confirmSignUp');
            }
            AmplifyEventBus.$emit('authState', 'signIn')
            return vm.$emit('authState', 'signIn');
          });
        })
        .catch(e => this.setError(e));      
    }
  },
  mounted()
  {
  },
  beforeDestroy()
  {
  },
  beforeCreate() 
  {
  }  
}
</script>