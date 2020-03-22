import Vue from 'vue'
import Vuex from 'vuex'
import { uuid } from 'vue-uuid';
import { Auth } from 'aws-amplify';
import Common from './Common.js';
import OpsConfig from './OperationsConfig.js';
import Comms from './components/Comms.vue';

const axios = require('axios')
var initialJot = { documentId: '-1'};

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
		currentJot:  { documentId: '-1'},
		signedIn: null, 
		username: "Not Initialized",
		isLoaded: false,
		errorLoadingState: false,
		currentMainSection: {},
		currentSelection:[],
		lastAddedSection:{},
		jotsList:[],
		currentDocumentId: '0',
		opsQueue:[],
		searchText:"",
		formattingInProgress:false,
		formattingSectionId:'',
		currentFocusSectionId:'',
		currentOpenSectionMenuId:null,
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
		},
	    getIsFormattingInProgress(state)
	    {
	  		return {inProgress: state.formattingInProgress, sectionId: state.formattingSectionId};
	    },		
	    getCurrentFocusSectionId(state)
	    {
	    	return state.currentFocusSectionId;
	    },
	    getCurrentOpenSectionMenuId(state)
	    {
	    	return state.currentOpenSectionMenuId;
	    }        
	},
	actions:
	{
		//WebSocket EVENTS
		// SOCKET_SectionInFocus(state, data)
		// {
		// 	console.log(state, data);
		// },
		///////////////////
	    // async saveOperations(state)
	    // {
	    //   var queue = state.getters.getOpsQueue;
	    //   var sendDoc=false;
	    //   var url = Common.URLS.Operations;
	    //   var result=null;
	    //   var opErrors=[];
	      
	    //   while (queue.length>0)
	    //   {
	    //     var op = queue.pop();
	        
	    //     if (OpsConfig.IgnoreOp(op)==false)
	    //     {
	    //     	console.log('sending op', op);
	    //     	result = await Comms.post(url, op);
	    //     	if (result==null)
	    //     	{
	    //     		console.log('There was an error applying OP ', op);
	    //     		opErrors.push(op);
	    //     	}

	    //     	Comms.wsEmit(this.$socket, Common.WSTypes.Operation, op);  
	    //     }
	    //   }
	    //   return opErrors;
	    // },	
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
	    async getOneJotsPermissions(state, jotId)
	    {	    
	   		if (jotId)
	   		{
				var url = Common.URLS.OneJot + jotId;
				var jot ={};
				if (this.getters.getSignedInState==true)
				{
					console.log('getting getOneJotsPermissions')
					jot = await Comms.get(url).catch((error) => 
					{ 
						// console.error(error); 
						return {error: error, jot: null};
					});
				}
				else
				{
					console.log('getting getOneJotsPermissions anon');
					url = Common.URLS.OneJot_Anonymous + jotId;	
					console.log('anon get', url);
					jot = await Comms.anonymousGet(url).catch((error) => 
					{ 
						return {error: error, jot: null};
					});
				}

				// var url = Common.URLS.OneJot + jotId;
				// var jot = await Comms.get(url).catch((error) => 
				// { 
				// 	// console.error(error); 
				// 	return {error: error, jot: null};
				// });

				if (jot && jot.length>0)
				{
					state.commit('setCurrentJot',  jot[0]);
				  	return {error: null, jot: jot[0]};
				}	   			
	   		}

			return {error: 'No jot Id', jot: null};
	    },
		async loadJotsSections(state, jotId)
		{
			var loadError=null;
			if (jotId)
			{
				var url = Common.URLS.Documents + jotId;
				if (this.getters.getSignedInState==true)
				{
					var items = await Comms.get(url).catch((error) => 
					{ 
						loadError=error;
					});
				}
				else
				{
					url = Common.URLS.Documents_Anonymous + jotId;	
					var items = await Comms.anonymousGet(url).catch((error) => 
					{ 
						loadError=error;
					});
				}


				if (loadError)
				{
					return {error: loadError, sections: null};
				}
				
				if (items)
				{
				  state.commit('initializeSection',  items);
				  state.isLoaded = true;	
				  return {error: null, sections: items};;	  	
				}
			}
			return {error: 'No section Id', sections: null};
		}, 
		clearStore(state)
		{
			state.commit('clearStoredData');
		}
	},
	mutations:
	{
	    setCurrentOpenSectionMenuId(state, sectionId)
	    {
	    	state.currentOpenSectionMenuId = sectionId;
	    },		
		setSectionInFocus(state, sectionId)
		{
			state.currentFocusSectionId=sectionId;
		},
	    setFormattingStarted(state, sectionId)
	    {
	      state.formattingInProgress=true;
	      state.formattingSectionId=sectionId;
	    },
	    setFormattingEnded(state, sectionId)
	    {
	      	if (sectionId == state.formattingSectionId)
	      	{
	      		state.formattingSectionId=-1;
	      		state.formattingInProgress=false;
	      	}
	    },		
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
			// console.log('adding server OP queue', operation);	
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
			// state.currentJot = {};
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
		// dragSections(state, payload)
		// {
		// 	var sections = payload.sections;
		// 	var oldIndex = payload.oldIndex;
		// 	var newIndex = payload.newIndex;

		// 	if (newIndex==0)
		// 	{
		// 		sections[newIndex].priorId = sections[newIndex].parentSection;	
		// 	}
		// 	else if (newIndex>0)
		// 	{
		// 		sections[newIndex].priorId = sections[newIndex-1].id;
		// 	}

		// 	if (oldIndex==0)
		// 	{
		// 		sections[oldIndex].priorId = sections[oldIndex].parentSection;	
		// 	}
		// 	else if (oldIndex>0)
		// 	{
		// 		sections[oldIndex].priorId = sections[oldIndex-1].id;
		// 	}	

		// 	if (newIndex+1!=oldIndex && newIndex<sections.length)
		// 	{
		// 		sections[oldIndex+1].priorId = sections[oldIndex].id;				
		// 	}		
		// },
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