var Sections = require('../Database/Sections'),
	Objects = require('../Objects'),
	Helpers = require('../Helpers'),
	Processors = require('../Processors');

exports.receiveAPIRequest = function(req, res)
{
	// console.log('eId', req.eId)
	// req.eId = 'XX';
	var valid = Helpers.validateEmployeeId(req, res);

	if (!valid)
	{
		var error = Helpers.logError('No ID', Helpers.ErrorCodes.UNAUTHORIZED);		
		return Helpers.sendErrorResponse(res, error);
	}

	try 
	{
		var APIProcessor = Processors.getAPIProcessor(req.route.path);
		if (APIProcessor)
		{
			APIProcessor(req.db, req.eId, req.params, function(error, result)
			{
				if (error)
				{
					// console.log(error);
					Helpers.logError(error);
					return Helpers.sendErrorResponse(res, error);			
				}
				else
				{
					return Helpers.sendResponse(res, result);
				}
			});
		}
		else
		{
			var error = Helpers.logError('No such API', Helpers.ErrorCodes.INTERNAL_ERROR);		
			return Helpers.sendErrorResponse(res, error);			
		}
	}
	catch(e)
	{
		console.log(e);
		var error = Helpers.logError('Error processing API', Helpers.ErrorCodes.INTERNAL_ERROR);		
		return Helpers.sendErrorResponse(res, error);		
	}
};

