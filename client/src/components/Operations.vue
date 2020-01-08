<script>
import Vue from 'vue';
import Common from '../Common.js';
import Comms from './Comms.vue';
import OpsConfig from '../OperationsConfig.js';
import { uuid } from 'vue-uuid';

export default 
{
	name: 'Operations',
	components: 
	{
	}, 	
	getNewSectionId()
	{
	    var id = uuid.v4();
	    return id;
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
    	var operation = 
	      	{
	      		type: OpsConfig.ValidClientOperations.MoveSection,   
	      		section: sectionToMove, 
				parentSection: fromParent, 
				position: newIndex
			};
		this.queueOperation(store, operation);
	},	
	moveSectionOps(store, sectionToMove, fromParent, newParent)
	{
		this.removeExistingSection(sectionToMove, fromParent);
		//debounce
        Common.sleep(5).then(() => {
          this.addExistingSection(sectionToMove, newParent);

	      var operation = 
	      	{
	      		type: OpsConfig.ValidClientOperations.MoveSection,   
	      		section: sectionToMove, 
				parentSection: newParent, 
				position: (newParent.sections.length-1)
			};
	      this.queueOperation(store, operation);

          Vue.nextTick(() => 
          {   
            document.getElementById(sectionToMove.id).focus();
          });  
        });
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
    addSectionOp(store, toSectionArray, parentSection, atIndex=-1)
    {      
		try
		{
			var newSection = this.addSection(toSectionArray, parentSection.id, atIndex);
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
    		console.log('added dummy op');
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
    saveOperations(store)
    {
    	store.dispatch('saveOperations');
    },
    addExistingSection(existingSection, toNewParentSection)
    {
      var priorId=undefined;

      existingSection.parentSection = toNewParentSection.id;

      toNewParentSection.sections.push(existingSection);
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
	addSection(currentSection, parentSection, atIndex)
	{			
		var sectionId = this.getNewSectionId();
		var priorId = undefined;
		var text =' ';

		var item = {id: sectionId, text: text, open: true, priorId: undefined, parentSection: parentSection, sections:[]};	

		if (atIndex>-1)
		{
			currentSection.splice(atIndex, 0, item);
		}
		else
		{
			currentSection.push(item);	
		}

		return item;
	},

}

</script>