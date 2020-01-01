<script>
import { Auth } from 'aws-amplify';
import store from './store';

export default 
{
  // GetUser() {
  //   return Auth.currentAuthenticatedUser().then((user) => {
  //     if (!user) {
  //       return null;
  //     }
  //     return user;
  //   }).catch(e => new Error(e));
  // },  
  async updateSignInStatus(store)
  {
    await Auth.currentAuthenticatedUser()
      .then(user => 
      {
        this.methods.setSignIn(store, user, true);
        return true;
      })
      .catch(err => this.methods.setSignIn(store, false));
  },
  getSignInStatus(store)
  {
    status = this.methods.getSignIn(store);
    return status;
  },   
  methods:
  {
    setSignIn(store, user, isSignedIn)
    {
      if (isSignedIn)
      {
        store.commit('setSignIn', user.username);  
      }
      else
      {
        store.commit('setSignOut');   
      }
    }, 
    getSignIn(store)
    {
      return store.getters.getSignedInState;
    },
    getToken(store)
    {
      
    }
  }
}

</script>