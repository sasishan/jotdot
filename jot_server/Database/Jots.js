var  Database  = require('../Database/Database')
	,Helpers  = require('../Helpers')
	,OpsConfig = require('../OperationsConfig')
	,Objects = require('../Objects')
	,Permissions = require('../Database/Permissions');

//API
exports.API_createJot = function(db, eId, data, callback)
{
	if (eId)
	{
		var orgId = '1';
		var title='Untitled';

		if (data.title)
		{
			title = data.title;
		}

		var newJot= new Objects.Document(eId, orgId, title);
		Database.InsertQuery(db, Database.Tables.Documents, newJot, {}, function(error, results)
		{
			if (error)
			{
				console.log(error);
				return callback(error, null);
			}
			return callback(null, results);
		} );
	}
	else
	{
		console.log('Error with id');
		return callback('Error with id', null);
	}	
}

exports.API_deleteJot = function(db, eId, data, callback)
{
	var orgId='1';

	if (eId)
	{
		var jotId = Helpers.getField(data, OpsConfig.APIPath_JotId, []);		
		if  (!jotId.isValid())
		{
			var error = Helpers.logError('Incorrect fields ' + data, Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}	

		var requiredPermissions = new Objects.RequiredPermissions(eId, true, true);
		requiredPermissions.requireOwnership(); //only owners can delete docs

		Permissions.validateDocumentPermissions(db, jotId.getValue(), requiredPermissions, function(error, isPermitted)
		{
			if (error)
			{
				return callback(error, null);
			}

			if (isPermitted!=true)
			{
				// var error = Helpers.logError('Not authorized to delete this document', Helpers.ErrorCodes.UNAUTHORIZED);
				var error = Helpers.LogUnauthorizedError();
				return callback(error, null);				
			}

			permitted_deleteJotAndSections(db, eId, jotId.getValue(), function(error, results)
			{
				if (error)
				{
					return callback(error, null);
				}

				return callback(null, results);
			});
		});
	}
	else
	{
		var error = Helper.logError('Error with id', Helpers.INTERNAL_ERROR);
		return callback(error, null);
	}		
}

exports.API_getAllJots= function(db, eId, data, callback)
{
	if (eId)
	{
		getAllReadableJots(db, eId, function(error, docs)
		{
			if (error)
			{
				return callback(error, null);
			}			

			return callback(null, docs);
		});
	}
	else
	{
		var error = Helpers.logError('Error with id', Helpers.INTERNAL_ERROR);
		return callback(error, null);
	}	
}

exports.API_getOneJot = function(db, eId, data, callback)
{
	var jotId = Helpers.getField(data, OpsConfig.APIPath_JotId, []);

	if (eId && jotId.isValid())
	{
		var documentId = jotId.getValue();
		var requiredPermissions = new Objects.RequiredPermissions(eId, true, false);
		Permissions.validateDocumentPermissions(db, documentId, requiredPermissions, function(error, isPermitted)
		{
			if (error)
			{
				return callback(error, null);
			}

			if (isPermitted==true)
			{
				exports.permitted_getJotRecord(db, null, documentId, function(error, docRecord)
				{
					if (error || docRecord.length==0)
					{
						return callback(error, null);
					}

					docRecord[0] = parseJotRecord(eId, docRecord[0]);
					return callback(null, docRecord);
				});			
			}
			else
			{
				// var error = Helpers.logError('Not authorized to view this document', Helpers.UNAUTHORIZED);
				var error = Helpers.LogUnauthorizedError();
				return callback(error, null);
			}
		});		
	}
	else
	{
		var error = Helpers.logError('Error with document id', Helpers.INTERNAL_ERROR);
		return callback(error, null);
	}	
}

//OPERATION PROCESSORS
exports.Operation_updateJot = function(db, eId, data, callback)
{
	if (eId)
	{
		var jotId = Helpers.getField(data, OpsConfig.SectionFields.DocumentId, []);

		if ( jotId.isValid() )
		{
			var documentId = jotId.getValue();
			var requiredPermissions = new Objects.RequiredPermissions(eId, true, true);
			Permissions.validateDocumentPermissions(db, documentId, requiredPermissions, function(error, isPermitted)
			{
				if (error)
				{
					return callback(error, null);
				}

				if (isPermitted==true)
				{
					permitted_updateJot(db, documentId, data, function(error, results)
					{
						if (error)
						{
							return callback(error, null);
						}
						return callback(null, results);
					});	
				}
				else
				{
					// var error = Helpers.logError('Not authorized to view this document', Helpers.UNAUTHORIZED);
					var error = Helpers.LogUnauthorizedError();
					return callback(error, null);
				}
			});				
		}
	}
	else
	{
		var error = Helpers.LogUnauthorizedError();
		return callback(error, null);
	}	
}

//HELPERS
parseJotRecord = function(eId, jotRecord)
{
	if (jotRecord)
	{
		var permissions= new Objects.Permissions();
		permissions.setDocumentPermissions(jotRecord);	

		var canRead =  permissions.canRead(eId);
		var canWrite = permissions.canWrite(eId);
		var isOwner = permissions.isOwner(eId);
		var eIdPermissions = {
			read: canRead, 
			write: canWrite,
			isOwner: isOwner
		};
		jotRecord.permissions=eIdPermissions;		
	}
	
	return jotRecord;
}

getJotUpdateQuery = function(data)
{
	var setupValues=[];

	var title = Helpers.getField(data, OpsConfig.JotFields.Title, []);

	if (!title.isValid())
	{
		return null;
	}
	var setStatement = { };
	if (title.isValid())
	{
		setStatement = { title: title.getValue()};
	}

	return setStatement;
}

permitted_updateJot=function(db, documentId, data, callback)
{
	if (!documentId || !data || !db)
	{
		var error = Helpers.logError('Internal error with query.', Helpers.INTERNAL_ERROR);
		return callback(error, null);
	}

	var updateQuery = getJotUpdateQuery(data);

	if ( updateQuery!=null )
	{			
		var findQuery = { [OpsConfig.JotFields.DocumentId]: documentId };

		Database.SetFieldQuery(db, Database.Tables.Documents, findQuery, updateQuery, null, 
			function(error, results)
			{
				if (error)
				{
					var error = Helpers.logError('Could not update', Helpers.INTERNAL_ERROR);
					return callback(error, null);
				}
				
				return callback(null, results);
			});
	}	
	else
	{
		var error = Helpers.logError('Internal error with query.', Helpers.INTERNAL_ERROR);
		return callback(error, null);
	}		
}

exports.permitted_getJotRecord = function(db, eId, documentId, callback)
{
	var findQuery = 
	{
		[OpsConfig.SectionFields.DocumentId]: documentId, 
	};

	if (eId)
	{
		findQuery[OpsConfig.SectionFields.EmployeeId]= eId;	
	}

	Database.GetQuery(
		db, 
		Database.Tables.Documents, 
		findQuery, 
		{}, 
		function(error, doc)
	{
		if (error)
		{
			var error = Helpers.logError('Could not retrieve document', Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}

		// doc[0] = parseJotRecord(eId, doc[0]);
		return callback(null, doc);	
	});
}

permitted_deleteJotAndSections = function(db, eId, jotId, callback)
{
	var findJotQuery = 
	{
		[OpsConfig.SectionFields.DocumentId]: jotId 
	};

	Database.DeleteQuery(
		db, 
		Database.Tables.Sections, 
		findJotQuery, 
		{}, 
		function(error, results)
	{
		if (error)
		{
			var error = Helpers.logError('Could not delete Jot sections', Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}

		Database.DeleteQuery(
			db, 
			Database.Tables.Documents, 
			findJotQuery, 
			{}, 
			function(error, results)
		{
			if (error)
			{
				var error = Helpers.logError('Could not delete Jot record', Helpers.INTERNAL_ERROR);
				return callback(error, null);
			}

			// doc[0] = parseJotRecord(eId, doc[0]);
			return callback(null, results);	
		});
	});	
}


getAllReadableJots = function(db, eId, callback)
{
	// var permissions = permissions.read_write[eId];
	var findQuery = 
	{
		'$or' : [ 
				{ [OpsConfig.SectionFields.EmployeeId]: eId }, 
				{ [OpsConfig.Permissions_Read]: { $in: [eId] }}
			]
	};

	Database.GetQuery(
		db, 
		Database.Tables.Documents, 
		findQuery, 
		OpsConfig.GET_AllDocuments_Projection, 
		function(error, docs)
	{
		if (error)
		{
			var error = Helpers.logError('Could not find document', Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}
		return callback(null, docs);	
	});
}