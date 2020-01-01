var Objects = require('../Objects'),
	Helpers = require('../Helpers'),
	Processors = require('../Processors'),
	OpsConfig = require('../OperationsConfig');

exports.receiveOperations = function(req, res)
{
	// req.eId = 'XX';
	var valid = Helpers.validateEmployeeId(req, res);

	if (!valid)
	{
		var error = Helpers.logError('No ID', Helpers.ErrorCodes.UNAUTHORIZED);		
		return Helpers.sendErrorResponse(res, error);
	}

	try
	{
		var operation = parseOneOperation(req, function(error, operation)
		{
			if (error)
			{
				return Helpers.sendErrorResponse(res, error);
			}
			console.log('Operations-processing: ', operation);
			processOneOperation(req, operation, function(error, operationResult)
			{
				if (error)
				{
					Helpers.logError(error);
					return Helpers.sendErrorResponse(res, error);			
				}
				else
				{
					return Helpers.sendResponse(res, operationResult);
				}
			});
		});

	}
	catch (e)
	{
		console.log(e);
		var error = Helpers.logError('Fatal error on operation', Helpers.ErrorCodes.INTERNAL_ERROR);		
		return Helpers.sendErrorResponse(res, error);		
	}
}

parseOneOperation = function(req, callback)
{
	var opToParse = req.body;
	var operation={};

	var validFields = Object.values(OpsConfig.ValidOperationsTypes);
	if (opToParse)
	{
		var typeField = Helpers.getField(opToParse, OpsConfig.OperationFields.Type, validFields);
		var dataField = Helpers.getField(opToParse, OpsConfig.OperationFields.Data, []);

		if ( typeField.isValid() )
		{
			operation = new Objects.Operation(typeField.fieldValue, dataField.fieldValue);
			operation.process = Processors.getProcessor(operation.type);
		}
		else
		{
			return callback(new Helpers.Error('Invalid fields or values in op: '+typeField.fieldName, Helpers.INTERNAL_ERROR), null);
		}
	}

	return callback(null, operation);
}

processOneOperation = function(req, operation, callback)
{
	operation.process(req.db, req.eId, operation.data, function(error, result)
	{
		if (error)
		{
			console.log(error);	
			return callback(error, null);
		}
		
		return callback(null, result);
	});
};

//MULTIPLE OPS
// parseOperations = function(req)
// {
// 	var opsToParse = req.body;
// 	var operations=[];

// 	for (var i=0; i<opsToParse.length; i++)
// 	{
// 		var oneOp = opsToParse[i];
// 		var typeField = Helpers.getField(oneOp, OperationFields.Type, validOperations);
// 		var dataField = Helpers.getField(oneOp, OperationFields.Data, []);

// 		if (  typeField.isValid() && dataField.isValid() )
// 		{
// 			var op = new Operation(typeField.fieldValue, dataField.fieldValue);
// 			operations.push(op);
// 		}
// 	}

// 	return operations;
// }

// processOperations = function(operations, callback)
// {	
// 	var responses = [];
// 	for (var i=0; i<operations.length; i++)
// 	{
// 	}

// 	return callback(null, responses);
// }

