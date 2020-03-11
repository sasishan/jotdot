var Sections = require('./Database/Sections'),
	Jots = require('./Database/Jots'),
	Tags = require('./Database/Tags'),
	OpsConfig = require('./OperationsConfig');

exports.getProcessor = function(operationType)
{
	switch(operationType)
	{
		case OpsConfig.ValidOperationsTypes.UpdateJot:
			return Jots.Operation_updateJot;

		case OpsConfig.ValidOperationsTypes.CreateSection:
			return Sections.Operation_newSection;

		case OpsConfig.ValidOperationsTypes.UpdateSection:
			return Sections.Operation_updateSection;

		case OpsConfig.ValidOperationsTypes.DeleteSection:
			return Sections.Operation_deleteSection;

		case OpsConfig.ValidOperationsTypes.MoveSection:
			return Sections.Operation_moveSection;			

		default:
			console.log('Processors:getProcessor: Invalid operation type '+ operationType + ' found for processor');
			return undefined;
	}
};

exports.getAPIProcessor = function(apiPath)
{
	switch(apiPath)
	{
		case OpsConfig.APIPaths.GET_AllJots:
			return Jots.API_getAllJots;

		case OpsConfig.APIPaths.GET_OneJot:
			return Jots.API_getOneJot;	

		case OpsConfig.APIPaths.POST_NewJot:
			return Jots.API_createJot;

		case OpsConfig.APIPaths.DELETE_OneJot:
			return Jots.API_deleteJot;			

		case OpsConfig.APIPaths.GET_OneJotsSections:
			return Sections.API_getOneDocumentsSections;	

		case OpsConfig.APIPaths.GET_AllTags:
			return Tags.API_getAllTags;	

		case OpsConfig.APIPaths.GET_TagSections:
			return Tags.API_getSectionsForTag;

		//Anonymous API routes
		case OpsConfig.APIPaths.GET_ANONYMOUS_AllJots:
			return Jots.API_getAllJots;		
			
		case OpsConfig.APIPaths.GET_ANONYMOUS_OneJotsSections:
			return Sections.API_getOneDocumentsSections;	

		case OpsConfig.APIPaths.GET_ANONYMOUS_OneJot:
			return Jots.API_getOneJot;

		default:
			console.log('Processors:getAPIProcessor: Invalid path: '+ apiPath + ' found for processor');
			return undefined;
	}
};