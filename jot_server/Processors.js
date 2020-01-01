var Sections = require('./Database/Sections'),
	OpsConfig = require('./OperationsConfig');

exports.getProcessor = function(operationType)
{
	switch(operationType)
	{
		case OpsConfig.ValidOperationsTypes.UpdateJot:
			return Sections.updateJot;

		case OpsConfig.ValidOperationsTypes.CreateSection:
			return Sections.newSection;

		case OpsConfig.ValidOperationsTypes.UpdateSection:
			return Sections.updateSection;

		case OpsConfig.ValidOperationsTypes.DeleteSection:
			return Sections.deleteSection;

		case OpsConfig.ValidOperationsTypes.MoveSection:
			return Sections.moveSection;			

		default:
			console.log('Invalid operation type '+ operationType + ' found for processor');
			return undefined;
	}
};

exports.getAPIProcessor = function(apiPath)
{
	switch(apiPath)
	{
		case OpsConfig.APIPaths.GET_OneJotsSections:
			return Sections.getOneDocumentsSections;
		
		case OpsConfig.APIPaths.GET_AllJots:
			return Sections.getDocuments;

		case OpsConfig.APIPaths.GET_OneJot:
			return Sections.getOneJot;		
	
		case OpsConfig.APIPaths.POST_NewJot:
			return Sections.createDocument;

		default:
			console.log('Invalid path: '+ apiPath + ' found for processor');
			return undefined;
	}
};