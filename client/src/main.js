import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router';
import { store } from './store';
import Axios from 'axios'
import BootstrapVue from 'bootstrap-vue'
import Amplify, * as AmplifyModules from 'aws-amplify'
import { AmplifyPlugin } from 'aws-amplify-vue'
import { Auth } from 'aws-amplify'
import UUID from 'vue-uuid';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core'
import Notes_Section from './components/Notes_Section.vue';
import sanitizeHTML from 'sanitize-html';
import io from 'socket.io-client';
import VueSocketIO from 'vue-socket.io';

// import moment from 'moment';
import {faSquare, faArrowCircleRight, faCircle, faAngleUp, faCog, faHashtag, faBars,
        faAngleDown, faTrashAlt, faSpinner, faEdit, faPrint, faArchive, faEllipsisH, faTimes, faArrowLeft, faArrowRight} from '@fortawesome/free-solid-svg-icons';
// import awsmobile from './aws-exports'

const awsconfig = {
    Auth: {
        //see details: https://aws-amplify.github.io/docs/js/authentication#manual-setup
        // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
        identityPoolId: 'us-west-2:0f9ad562-134b-426c-a63b-c69736e2411b',
        
        // REQUIRED - Amazon Cognito Region
        region: 'us-west-2',

        // OPTIONAL - Amazon Cognito Federated Identity Pool Region 
        // Required only if it's different from Amazon Cognito Region
        identityPoolRegion: 'us-west-2',

        // OPTIONAL - Amazon Cognito User Pool ID
        userPoolId: 'us-west-2_GLGsA5Q56',

        // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
        userPoolWebClientId: '76t2p64grutkk94h0o217gljn7',

        // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
        mandatorySignIn: true,

    }

};

Amplify.configure( awsconfig );
const currentConfig = Auth.configure(); 

import routes from './Routes.vue'
import AuthHelper from './AuthHelper.vue'

const router  = new VueRouter ({routes});
router.beforeEach((to, from, next) => 
{
    if (to.matched.some(record => record.meta.requiresAuth)) {
        // this route requires auth, check if logged in
        // if not, redirect to login page.
        Auth.currentSession()
        .then(function(session)
        {
            if (session)
            {
                next();
            }
            else
            {
                next({
                    path: '/Signin',
                    query: { redirect: to.fullPath } })                
            }
        }, 
        function(err) {
            // console.log(err);
            next({
                    path: '/Signin',
                    query: { redirect: to.fullPath } })  
        });
    }
    else
    {
        next();
    }
})

Vue.use(VueRouter);
Vue.use(AmplifyPlugin, AmplifyModules);
Vue.use(UUID);

Vue.use(require('vue-moment'));
Vue.config.productionTip = false
Vue.prototype.$http = Axios;
// Vue.prototype.moment = moment;

Vue.use(new VueSocketIO({
    debug: true,
    connection: 'http://localhost:3020', //options object is Optional
    vuex: {
      store,
      actionPrefix: "SOCKET_",
      mutationPrefix: "SOCKET_"
    }
  })
);

const token = localStorage.getItem('token')
if (token) 
{
  Vue.prototype.$http.defaults.headers.common['Authorization'] = token
}

Vue.prototype.$sanitize = sanitizeHTML;

library.add(faEdit, faSquare, faArrowCircleRight, 
    faCircle, faBars, faAngleUp, faAngleDown, faTrashAlt, 
    faSpinner, faPrint, faCog, faHashtag, faArchive, faEllipsisH, 
    faArrowRight, faArrowLeft, faTimes);
Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.use(BootstrapVue)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import draggable from 'vuedraggable'

new Vue({
	store,
    router,
    Notes_Section,
    draggable,
	render: h => h(App),
}).$mount('#app')
