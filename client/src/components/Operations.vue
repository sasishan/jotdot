<script>
import Vue from 'vue';
import Common from '../Common.js';
import Comms from './Comms.vue';
import OpsConfig from '../OperationsConfig.js';


export default 
{
	name: 'Operations',
	components: 
	{
	}, 			
	queueOperation(store, item) 
	{			
		var op = null;

		var docId=store.getters.getCurrentJotId;

		if (item.type==OpsConfig.ValidClientOperations.AddSection)
		{
			// op = this.getNewSectionOperation(docId, item.section.id, "", "", item.parentSection.id, item.position);
			op = new OpsConfig.NewSectionOperation(docId, item.section.id, "", "", item.parentSection.id, item.position);
		}
		else if (item.type==OpsConfig.ValidClientOperations.MoveSection)
		{
			op = new OpsConfig.MoveSectionOperation(docId, item.section.id, item.parentSection.id, item.position);
		}			
		else if ( item.type==OpsConfig.ValidClientOperations.UpdateSectionText || 
				  item.type==OpsConfig.ValidClientOperations.OpenCloseSection )
		{
			if (item.type==OpsConfig.ValidClientOperations.UpdateSectionText)
			{
				op = new OpsConfig.UpdateTextOperation(docId, item.section.id, item.newText, item.newHTML, item.tags);
			}
			else
			{
				op = new OpsConfig.UpdateOpenCloseOperation(docId, item.section.id, item.open);	
			}
		}
		else if (item.type==OpsConfig.ValidClientOperations.DeleteSection)
		{
			op = new OpsConfig.DeleteOperation(docId, item.section.id);
		}
		else if (item.type==OpsConfig.ValidClientOperations.UpdateJotTitle)
		{
			op = new OpsConfig.UpdateJotTitleOperation(docId, item.newTitle);
		}
		else if (item.type==OpsConfig.ValidClientOperations.NoOp)
		{
			op = new OpsConfig.NoOp();
		}

		if (op)
		{
			store.commit('queueOperation', op);	
		}
		
	},		
	dragSectionOp(store, sectionToMove, fromParent, newParent, newIndex)
	{
		console.log('dragSectionOp', sectionToMove, fromParent, newParent, newIndex);
    	var operation = 
	      	{
	      		type: OpsConfig.ValidClientOperations.MoveSection,   
	      		section: sectionToMove, 
				parentSection: newParent, 
				position: newIndex
			};
		this.queueOperation(store, operation);
	},
	moveSectionOps(store, sectionToMove, fromParent, newParent, newIndex=Common.APPEND_SECTION)
	{
		this.removeExistingSection(sectionToMove, fromParent);
		
		//debounce
        // Common.sleep(5).then(() => 
        // {
        	var position;
        	if (newIndex==Common.APPEND_SECTION || newIndex>=newParent.sections.length)
        	{
    			console.log('a');
        		this.addExistingSection(sectionToMove, newParent);
        		position = newParent.sections.length-1;		
        	}
        	else
        	{
        		console.log('b');
        		position=newIndex;
        		this.addExistingSection(sectionToMove, newParent, newIndex);		
        	}
        	console.log('moveSectionOps', sectionToMove);
			var operation = 
				{
					type: OpsConfig.ValidClientOperations.MoveSection,   
					section: sectionToMove, 
					parentSection: newParent, 
					position: position
				};
			this.queueOperation(store, operation);

			Vue.nextTick(() => 
			{   
				document.getElementById(sectionToMove.id).focus();
			});  
        // });
	},
	openCloseOp(store, section, open)
	{
		try
		{
			var operation = {
					type: OpsConfig.ValidClientOperations.OpenCloseSection, 
					section: section,
					open: open
				};

			this.queueOperation(store, operation);
		}
		catch (e)
		{
			console.log(e);
		}		
	},
	jotTitleChangeOp(store, newTitle)
	{
		try
		{
			var operation = {
					type: OpsConfig.ValidClientOperations.UpdateJotTitle, 
					newTitle: newTitle
				};

			this.queueOperation(store, operation);
		}
		catch (e)
		{
			console.log(e);
		}
	},
	textChangeOp(store, section, text, html, tags)
    {      
		try
		{
			var operation = {
					type: OpsConfig.ValidClientOperations.UpdateSectionText, 
					section: section,
					newText: text,
					newHTML: html, 
					tags: tags
				};

			this.queueOperation(store, operation);
		}
		catch (e)
		{
			console.log(e);
		}
    },
    // addSectionOp(store, toSectionArray, parentSection, atIndex=-1)
    addSectionOp(store, newSection, parentSection, atIndex=-1)
    {      
		try
		{
			var operation = {
					type: OpsConfig.ValidClientOperations.AddSection, 
					section: newSection, 
					parentSection: parentSection, 
					position: (atIndex)
				};

			this.queueOperation(store, operation);
		}
		catch (e)
		{
			console.log(e);
		}
		return newSection;
    },
    //This is a NOOP to indicate a pending entry is being processed for the queue
    addPlaceHolderNoOp(store)
    {
    	// if (store.getters.getOpsQueue.length==0)
    	{
    		// console.log(store.getters.getOpsQueue.length);
    		this.queueOperation(store, { type: OpsConfig.ValidClientOperations.NoOp} );	
    	}
    	
    },
    removeSectionOp(store, sectionToRemove, fromParent)
    {      
		try
		{
	        this.removeExistingSection(sectionToRemove, fromParent);
	        var operation =  {
	        	type: OpsConfig.ValidClientOperations.DeleteSection,
	        	section: sectionToRemove}
			this.queueOperation(store, operation);
		}
		catch (e)
		{
			console.log(e);
		}
    },    
    async saveOperations(store, socket, callback)
    {
    	var errors = await this.sendOperations(store, socket);
    	//store.dispatch('saveOperations');
    	if (errors.length>0)
		{
			// console.log('Errors saving: ', errors);
			return callback(errors, null);
		}
		return callback(null, 'success');
    },
    async sendOperations(store, socket)
    {
      var queue = store.getters.getOpsQueue;
      var sendDoc=false;
      var url = Common.URLS.Operations;
      var result=null;
      var opErrors=[];
      
      while (queue.length>0)
      {
        var op = queue.pop();
        
        if (OpsConfig.IgnoreOp(op)==false)
        {
        	console.log('sending op', op);
        	result = await Comms.post(url, op);
        	if (result==null)
        	{
        		console.log('There was an error applying OP ', op);
        		opErrors.push(op);
        	}

        	Comms.wsEmit(socket, Common.WSTypes.Operation, op);  
        }
      }
      return opErrors;
    },	    
    addExistingSection(existingSection, toNewParentSection, toIndex=Common.APPEND_SECTION)
    {
      var priorId=undefined;

      existingSection.parentSection = toNewParentSection.id;

      if (toIndex==Common.APPEND_SECTION)
      {
      	toNewParentSection.sections.push(existingSection);
      }
      else
      {
      	// console.log('splicing', toNewParentSection.sections, toIndex);	
      	toNewParentSection.sections.splice(toIndex, 0, existingSection );	
      }
      
    },    
	removeExistingSection(sectionToRemove, fromParent)
	{
		// console.log(existingSection);
		var priorId=undefined;
		// var fromParent = payload.fromParent;
		var index=-1;

		for (var i=0; i< fromParent.sections.length; i++)
		{
			var s = fromParent.sections[i];

			if (s.id == sectionToRemove.id)
			{
				index = i;
				break;
			}
		}

		if (index>-1)
		{
			if (fromParent.sections[index+1]) //if there's a next child, make it's prior point to the new prior
			{
				if (fromParent.sections[index-1])
				{
					fromParent.sections[index+1].priorId = fromParent.sections[index-1].id;
				}
				else
				{
					fromParent.sections[index+1].priorId = fromParent.id; //or point to the parent if no prior		
				}
			}
			fromParent.sections.splice(index, 1);
			sectionToRemove.parentSection=undefined;
			sectionToRemove.priorId=undefined;
		}	
	},    


}

</script>