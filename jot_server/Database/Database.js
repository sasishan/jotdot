var ObjectId = require('mongodb').ObjectID;

var Tables={};
Tables.Sections = "Sections";
Tables.Documents = "Documents";
exports.Tables = Tables;

exports.GetPersonId = function(req)
{
	return req.user.username;// exports.GetPersonIdFromEmail(req.user.email);
}

exports.GetPersonOrgId = function(req)
{
	if (req.person && req.person.orgId)
	{
		return req.person.orgId;
	}
	else
	{
		return -1; //return a value 
	}
}

exports.GetPersonIdFromEmail = function(email)
{
	var name = ((email).substring(0, email.lastIndexOf("@"))).split('.').join("");
	return name;	
}

exports.GetOrganizationFromEmail = function(email)
{
	var domain = (email).substring(email.lastIndexOf("@") +1);
	orgs = domain.split('.');
	if (orgs.length>1)
	{
		return orgs[0];
	}
	else
	{
		return domain;	
	}	
}

exports.GetOrganization= function(req)
{
	return exports.GetOrganizationFromEmail(req.user.email);
}

exports.GetMaxMin = function(db, collectionName, findQuery, sortOptions, callback)
{
	if (!db || !collectionName || !findQuery)
	{
		return callback({ errorCode: -1, errorMessage: "Invalid parameters"}, null);
	}

    var collection = db.get(collectionName);
    if (!collection)
    {
    	return callback({ errorCode: -1, errorMessage: "No collection found"}, null);
    }

    try
    {
	    collection.find(findQuery, { sort: sortOptions, limit: 1 }, function(error, result)
		{	    	
	    	if (error)
			{
	    		console.log(error);
	    		return callback({ errorCode: -2, errorMessage: "Error executing query"}, null);
			}
	    
			return callback(null, result);
		});
    }
    catch (error)
    {
    	return callback({ errorCode: -3, errorMessage: "Internal exception: "+error}, null);
    }
}

exports.GetDistinct = function(db, collectionName, fieldString, findQuery, options, callback)
{
	if (!db || !collectionName || !findQuery)
	{
		return callback({ errorCode: -1, errorMessage: "Invalid parameters"}, null);
	}

    var collection = db.get(collectionName);
    if (!collection)
    {
    	return callback({ errorCode: -1, errorMessage: "No collection found"}, null);
    }

    try
    {
	    collection.distinct( fieldString, findQuery, options, function(error, result)
		{	    	
	    	if (error)
			{
	    		console.log(error);
	    		return callback({ errorCode: -2, errorMessage: "Error executing distinct query"}, null);
			}
	    
			return callback(null, result);
		});
    }
    catch (error)
    {
    	return callback({ errorCode: -3, errorMessage: "Internal exception: "+error}, null);
    }
}


exports.GetQuery = function(db, collectionName, findQuery, options, callback)
{
	if (!db || !collectionName || !findQuery)
	{
		return callback({ errorCode: -1, errorMessage: "Invalid parameters"}, null);
	}

    var collection = db.get(collectionName);
    if (!collection)
    {
    	return callback({ errorCode: -1, errorMessage: "No collection found"}, null);
    }

    try
    {
	    collection.find( findQuery, options, function(error, result)
		{	    	
	    	if (error)
			{
	    		console.log(error);
	    		return callback({ errorCode: -2, errorMessage: "Error executing query"}, null);
			}
	    
			return callback(null, result);
		});
    }
    catch (error)
    {
    	return callback({ errorCode: -3, errorMessage: "Internal exception: "+error}, null);
    }
}

exports.InsertElementIntoArray = function(db, collectionName, findQuery, elementToInsert, arrayName, arrayPosition=0, upsertOption=true, callback)
{
	if (!db || !collectionName || !findQuery)
	{
		return callback({ errorCode: -1, errorMessage: "Invalid parameters"}, null);
	}

    var collection = db.get(collectionName);
    if (!collection)
    {
    	return callback({ errorCode: -1, errorMessage: "No collection found"}, null);
    }

    try
    {
    	upd = {$push: { [arrayName]: {$each : [elementToInsert], $position: arrayPosition}} };

	    collection.update( findQuery, upd, {upsert: upsertOption}, function(error, result)
		{	    	
	    	if (error)
			{
	    		console.log(error);
	    		return callback({ errorCode: -2, errorMessage: "Error executing query"}, null);
			}
	    
			return callback(null, result);
		});
    }
    catch (error)
    {
    	return callback({ errorCode: -3, errorMessage: "Internal exception: "+error}, null);
    }
}

exports.DeleteElementFromArray = function(db, collectionName, findQuery, elementToDelete, arrayName, callback)
{
	if (!db || !collectionName || !findQuery)
	{
		return callback({ errorCode: -1, errorMessage: "Invalid parameters"}, null);
	}

    var collection = db.get(collectionName);
    if (!collection)
    {
    	return callback({ errorCode: -1, errorMessage: "No collection found"}, null);
    }

    try
    {
    	upd = {$pull: { [arrayName]: elementToDelete } };

	    collection.update( findQuery, upd, { multi: true }, function(error, result)
		{	    	
	    	if (error)
			{
	    		console.log(error);
	    		return callback({ errorCode: -2, errorMessage: "Error executing query"}, null);
			}
	    
			return callback(null, result);
		});
    }
    catch (error)
    {
    	return callback({ errorCode: -3, errorMessage: "Internal exception: "+error}, null);
    }
}


exports.DeleteQuery = function(db, collectionName, findQuery, options, callback)
{
	if (!db || !collectionName)
	{
		return callback({ errorCode: -1, errorMessage: "Invalid parameters"}, null);
	}

    var collection = db.get(collectionName);
    if (!collection)
    {
    	return callback({ errorCode: -1, errorMessage: "No collection found"}, null);
    }

    try
    {
	    collection.remove( findQuery, function(error, result)
		{	    	
	    	if (error)
			{
	    		console.log(error);
	    		return callback({ errorCode: -2, errorMessage: "Error executing query"}, null);
			}
	    
			return callback(null, result);
		});
    }
    catch (error)
    {
    	return callback({ errorCode: -3, errorMessage: "Internal exception: "+error}, null);
    }
}

exports.InsertQuery = function(db, collectionName, data, options, callback)
{
	if (!db || !collectionName)
	{
		return callback({ errorCode: -1, errorMessage: "Invalid parameters"}, null);
	}

    var collection = db.get(collectionName);
    if (!collection)
    {
    	return callback({ errorCode: -1, errorMessage: "No collection found"}, null);
    }

    try
    {
	    collection.insert( data, function(error, result)
		{	    	
	    	if (error)
			{
	    		console.log(error);
	    		return callback({ errorCode: -2, errorMessage: "Error executing query"}, null);
			}
	    
			return callback(null, result);
		});
    }
    catch (error)
    {
    	return callback({ errorCode: -3, errorMessage: "Internal exception: "+error}, null);
    }
}

exports.UpdateFieldQuery = function(db, collectionName, findQuery, updateField, newValue, options, callback)
{
	if (!db || !collectionName || !findQuery)
	{
		return callback({ errorCode: -1, errorMessage: "Invalid parameters"}, null);
	}

    var collection = db.get(collectionName);
    if (!collection)
    {
    	return callback({ errorCode: -1, errorMessage: "No collection found"}, null);
    }

    try
    {
		collection.update(findQuery, { $set: { [updateField] : newValue }}, function(error, result)
		{
	    	if (error)
			{
	    		console.log(error);
	    		return callback({ errorCode: -2, errorMessage: "Error executing query"}, null);
			}
	    
			return callback(null, result);
		});	    	
    }
    catch (error)
    {
    	return callback({ errorCode: -3, errorMessage: "Internal exception: "+error}, null);
    }
}

exports.SetFieldQuery = function(db, collectionName, findQuery, setQuery, options, callback)
{
	if (!db || !collectionName || !findQuery)
	{
		return callback({ errorCode: -1, errorMessage: "Invalid parameters"}, null);
	}

    var collection = db.get(collectionName);
    if (!collection)
    {
    	return callback({ errorCode: -1, errorMessage: "No collection found"}, null);
    }

    try
    {
		collection.update(findQuery, { $set: setQuery }, function(error, result)
		{
	    	if (error)
			{
	    		console.log(error);
	    		return callback({ errorCode: -2, errorMessage: "Error executing query"}, null);
			}
	    
			return callback(null, result);
		});	    	
    }
    catch (error)
    {
    	return callback({ errorCode: -3, errorMessage: "Internal exception: "+error}, null);
    }
}
