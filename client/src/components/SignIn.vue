<template>
  
   <b-row align="center" justify="center">
      <b-col cols="12" sm="8" md="4">
        <b-card
          header-class="signInHeader"
          align="left">
          <strong slot="header">{{ formState === 'signIn' ? 'Sign In to JotDot' : 'Complete Sign Up' }} </strong>
          <span v-if="formState=='signIn'">   
            <b-card-text>
              <b-form align="left">
                <label for="email" >Email</label>
                <b-input
                  id="email"
                  v-model="form.login"
                  type="text"
                  class="mb-2"></b-input>
                <label for="password" 
                  class="mt-3">Password</label>  
                <b-input
                  id="Password"
                  v-model="form.password"
                  type="password" ></b-input>
                </b-form>            
            </b-card-text>
            <b-btn variant="primary" class="mt-3" @click="signIn" align="right">Sign In</b-btn>
          </span>
          <span v-if="formState=='confirmSignUp'">                  
            <b-card-text>
              <b-form align="left">
                <label for="email" >Email</label>
                <b-input
                  id="email"
                  v-model="form.login"
                  type="text"
                  class="mb-2"></b-input>
                <b-text-field
                  label="Confirmation Code"
                  v-model="code">
                  </b-text-field>
              </b-form>
            </b-card-text>
            <b-btn color="primary" @click="confirmSignUp" align="right">Confirm Code</b-btn>
            <p class="ml-1 pa-3">Resend Code</p>
          </span>            
          <p class="red--text ml-1 pa-3" v-if="errorExists">{{error.message}}</p>

        </b-card>
      </b-col>
    </b-row>

</template>
<script>
import { Auth } from 'aws-amplify'
import { AmplifyEventBus } from 'aws-amplify-vue';
import Comms from './Comms.vue';
import Common from '../Common.js';

export default 
{
  name: 'SignIn',
  data: () => (
  {  
    formState: 'signIn',
    form: {
        login: '',
        password: ''
      },
    code:'',
    error:{},
    errorExists:false
  }),
  components: 
  {
  },
  methods:
  {
    async confirmUser(username, id, callback)
    {
      var person = 
      {
        username: username,
        userId: id
      };

      var url = Common.RegisterNewUser;      
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
    async resendCode()
    {
        this.clearError();  
        const login = this.form.login;

        this.$Amplify.Auth.resendSignUp(login)
            .then(() => {
              console.log('resending code');
              this.setError({message: 'Code has been resent.'})
              return;
            })
            .catch(e => this.setError(e));
    },
    async confirmSignUp()
    {
        this.clearError();  
        this.form.password='';
        const login = this.form.login;
        const code = this.code;

        this.$Amplify.Auth.confirmSignUp(login, code)
          .then(data => 
          {
            AmplifyEventBus.$emit('authState', 'signIn');

            this.formState='signIn';
          })
          .catch(e => this.setError(e));
    },
    async signIn()
    {
      this.clearError();  
      const { login, password } = this.form;

      Auth.signIn(login, password)
      .then(data => 
      {
        if (data.challengeName === 'SMS_MFA' || data.challengeName === 'SOFTWARE_TOKEN_MFA') {
          AmplifyEventBus.$emit('localUser', data);
          return AmplifyEventBus.$emit('authState', 'confirmSignIn')
        } else if (data.challengeName === 'NEW_PASSWORD_REQUIRED') {
          AmplifyEventBus.$emit('localUser', data);
          return AmplifyEventBus.$emit('authState', 'requireNewPassword');
        } else if (data.challengeName === 'MFA_SETUP') {
          AmplifyEventBus.$emit('localUser', data);
          return AmplifyEventBus.$emit('authState', 'setMfa');
        } else if (data.challengeName === 'CUSTOM_CHALLENGE' &&
          data.challengeParam &&
          data.challengeParam.trigger === 'true'
        ) 
        {
          AmplifyEventBus.$emit('localUser', data);
          return AmplifyEventBus.$emit('authState', 'customConfirmSignIn')
        } 
        else 
        {
          return AmplifyEventBus.$emit('authState', 'signedIn')
        }
      })
      .catch((e) => {
        if (e.code && e.code === 'UserNotConfirmedException')
        {
          AmplifyEventBus.$emit('localUser', {username: login });
          AmplifyEventBus.$emit('authState', 'confirmSignUp');
          this.formState = 'confirmSignUp';
        } 
        else 
        {
          // console.log(e);
          this.setError(e);
        }
      });
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

<style scoped>
.signInHeader
{
  background-color: #1976d2;
  color: white;
}

.btn-primary
{
  background-color: #1976d2 !important;
  color: white;
}


</style>