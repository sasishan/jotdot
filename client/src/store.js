import Vue from 'vue'
import Vuex from 'vuex'
import { uuid } from 'vue-uuid';
import { Auth } from 'aws-amplify';
import Common from './Common.js';
import Comms from './components/Comms.vue';
const axios = require('axios')

Vue.use(Vuex);

function getNewSectionId()
{
	var id = uuid.v4();
	return id;
}

export const store = new Vuex.Store({
	state : 
	{
		//Cognito Signin
		cognitoInfo:{},
		currentJot:{ documentId: '-1'},
		signedIn: false, 
		username: "Not Initialized",
		isLoaded: false,
		errorLoadingState: false,
		currentMainSection: {},
		currentSelection:[],
		lastAddedSection:{},
		jotsList:[],
		currentDocumentId: '125',
		opsQueue:[],
		searchText:"",

		//Notes
		masterSection: 
		{ 
			id: Common.RootSectionId, 
			sections: 
				[{ 	id: uuid.v4(),  
					text: '', 
					open: true, 
					parentSection: Common.RootSectionId, 
					sections:[]}]
		}
	},
	getters:
	{
		//Sign in 
		getCognitoInfo(state) 
		{
			return state.cognitoInfo;
		},
		getSignedInState(state)
		{
			return state.signedIn;
		},
		getUsername(state)
		{
			return state.username;
		},
		isLoaded(state)
		{
			return state.isLoaded;
		},
		getLastAddedSection(state)
		{
			return state.lastAddedSection;
		},
		//Notes		
		sectionsList(state) 
		{
			// console.log(state.masterSection);
			return state.masterSection;
		},
		getSection(state)
		{
	    	return section => state.masterSection.sections.filter(section =>{ return section.id === sectionId });
		},
		getCurrentMainSection(state)
		{
			return state.currentMainSection;
		},
		getCurrentSelection(state)
		{
			return state.currentSelection;
		},
		getCurrentJot(state)
		{
			return state.currentJot;
		},
		getCurrentJotId(state)
		{
			return state.currentDocumentId;
		},
		getJotsList(state)
		{
			// getNextOpItem
			return state.jotsList;
		},
		getOpsQueue(state) 
		{
			return (state.opsQueue);
		},
		getSearchText(state)
		{
			return (state.searchText);
		}
	},
	actions:
	{
	    async saveOperations(state)
	    {
	      var queue = state.getters.getOpsQueue;
	      var sendDoc=false;
	      var url = Common.URLS.Operations;

	      while (queue.length>0)
	      {
	        var op = queue.pop();
        	var result = await Comms.post(url, op);
        	// if (result==null)
        	// {
        	// 	var result = await Comms.post(url, op);
        	// }
        	if (result==null)
        	{
        		console.log('There was an error applying OP ', op);
        	}

	      }
	    },	
	   //  async loadJots(state, payload)
	   //  {
		  // var url = Common.URLS.Documents;
		  // var item = await Comms.get(url);

		  // if (item)
		  // {
			 //  state.commit('initializeJots',  item);
			 //  return true;
		  // }
		  // return false;

	   //  },	
	    async getOneJot(state, jotId)
	    {
	   		if (jotId)
	   		{
				var url = Common.URLS.OneJot + jotId;
				var jot = await Comms.get(url);

				if (jot && jot.length>0)
				{
					state.commit('setCurrentJot',  jot[0]);
				  	return jot[0];
				}	   			
	   		}

			return null;
	    },
		async loadSection(state, payload)
		{
			if (state.getters.getCurrentJotId)
			{
				var url = Common.URLS.Documents + state.getters.getCurrentJotId;
				var items = await Comms.get(url);
				if (items)
				{
				  state.commit('initializeSection',  items);
				  state.isLoaded = true;	
				  return true;	  	
				}
			}
			return false;
		}, 
		clearStore(state)
		{
			state.commit('clearStoredData');
		}
	},
	mutations:
	{
		clearTriggetTextChange(state)
		{
			state.triggerTextChange = false;
		},
		setSearchText(state, text)
		{
			state.searchText = text;
		},		
		queueOperation(state, operation)
		{
			console.log('adding server OP queue', operation);	
			state.opsQueue.unshift(operation);	
		},
		setJotsList(state, jots)
		{
			state.jotsList = jots;
		},
		setCurrentJotId(state, jotId)
		{
			state.currentDocumentId = jotId;
		},
		setCurrentJot(state, jot)
		{
			state.currentJot = jot;
		},
		//Sign in 
		clearStoredData(state)
		{
			state.isLoaded = false;
			state.currentMainSection= {};
			state.currentSelection.splice(0, state.currentSelection.length);
			state.lastAddedSection={};
			state.currentJot = {};
			state.jotsList = [];
			state.currentDocumentId = null;
			state.currentJot = null;
		},
		setIsLoaded(state, isLoaded)
		{
			state.isLoaded = isLoaded;
		},
		setSignIn(state, username)
		{
			state.signedIn=true;
			state.username = username;
		},		
		setSignOut(state)
		{
			state.signedIn=false;
			state.username="";
			state.cognitoInfo={}
		},
		setCognitoInfo(state, info)
		{
			state.cognitoInfo = info;
		},
		setCurrentMainSection(state, section)
		{
			state.currentMainSection = section;
		},		
		setCurrentSelection(state, section)
		{
			state.currentSelection = section;
		},		
		dragSections(state, payload)
		{
			var sections = payload.sections;
			var oldIndex = payload.oldIndex;
			var newIndex = payload.newIndex;

			if (newIndex==0)
			{
				sections[newIndex].priorId = sections[newIndex].parentSection;	
			}
			else if (newIndex>0)
			{
				sections[newIndex].priorId = sections[newIndex-1].id;
			}

			if (oldIndex==0)
			{
				sections[oldIndex].priorId = sections[oldIndex].parentSection;	
			}
			else if (oldIndex>0)
			{
				sections[oldIndex].priorId = sections[oldIndex-1].id;
			}	

			if (newIndex+1!=oldIndex && newIndex<sections.length)
			{
				sections[oldIndex+1].priorId = sections[oldIndex].id;				
			}		
		},
		initializeJots(state, payload)
		{
			state.jotsList=[];
			for (var i=0; i<payload.length;i++)
			{
				state.jotsList.push(payload[i]);
			}
		},
		initializeSection(state, payload)
		{
			// var newMasterSection = payload;
			// console.log(payload);
			state.masterSection.sectionId = Common.RootSectionId;
			state.masterSection.open = true;
			//newMasterSection.open;
			state.masterSection.sections=[];
			state.masterSection.text = "";
			for (var i=0; i<payload.length;i++)
			{
				state.masterSection.sections.push(payload[i]);
			}			
		},
	}
})