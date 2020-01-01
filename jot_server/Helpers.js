var Objects = require('./Objects');

exports.Success=0;
exports.Error=-1;

var ErrorCodes=
{
	INTERNAL_ERROR :500,
	UNAUTHORIZED: 401, 
	BAD_REQUEST: 400, 
	NOT_FOUND: 404
};
exports.ErrorCodes=ErrorCodes;

var SuccessCodes=
{
	OK :200,
	NO_CONTENT: 204		
};
exports.SuccessCodes= SuccessCodes;

exports.validateEmployeeId = function(req, res)
{
	if (!req.eId)
	{			
		return false;
	}
	return true;
};

exports.logError = function(error)
{
	if (error.message)
	{
		console.log('Error: ' + error.message);		
	}
}

exports.logError = function(message, errorCode)
{
	console.log('Error: ' + message);
	return new exports.Error(message, errorCode);
}

var Debug = true;
exports.Log = function(value)
{
	if (Debug)
	{
		console.log(value);
	}
};

exports.Error = function(message, errorCode)
{
	var error = {
		message: message,
		errorCode: ErrorCodes.INTERNAL_ERROR
	};

	if (ErrorCodes[errorCode])
	{
		error.errorCode = errorCode;
	}

	return error;
}

exports.sendResponse = function(res, response)
{
	return res.status(exports.SuccessCodes.OK).send(response);
}

exports.sendErrorResponse = function(res, error)
{
	return res.status(error.errorCode).send(error.message);	
}

exports.getField = function(jsonVar, fieldName, validFieldValues)
{
	var fieldValue=undefined;

	if ([fieldName] in jsonVar)
	{
		fieldValue = jsonVar[fieldName];

		var isValid=true;
		if (validFieldValues.length>0)
		{
			isValid=false;
		}


		for (var i=0; i<validFieldValues.length;i++)
		{
			if (fieldValue==validFieldValues[i])
			{
				isValid=true;
				break;
			}
		}

		var field = new Objects.RESTField(fieldName, fieldValue, isValid, true);
	}
	else
	{
		var field = new Objects.RESTField(fieldName, fieldValue, false, false);
	}
	return field;
}


