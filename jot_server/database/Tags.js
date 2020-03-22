var  Database  = require('../Database/Database')
	,Helpers  = require('../Helpers')
	,OpsConfig = require('../OperationsConfig')
	,Objects = require('../Objects')
	,Jots  = require('../Database/Jots')
	,Sections  = require('../Database/Sections')
	,Permissions = require('../Database/Permissions');

//API
exports.API_getAllTags= function(db, eId, data, callback)
{
	// var eId='sasishan_667@hotmail.com';
	// console.log('API_getAllTags',eId);
	if (eId)
	{
		getAllTagsFromReadableJots(db, eId, function(error, tags)
		{
			if (error)
			{
				return callback(error, null);
			}			

			return callback(null, tags);
		});
	}
	else
	{
		var error = Helpers.logError('Error with id', Helpers.INTERNAL_ERROR);
		return callback(error, null);
	}	
}

exports.API_getSectionsForTag = function(db, eId, data, callback)
{
	var tag = Helpers.getField(data, OpsConfig.APIPath_TagName, []);
	var sectionsList=[];
	if (eId && tag.isValid())
	{
		Sections.permitted_getSectionsByTag(db, eId, tag.getValue(), function(error, sections)
		{
			if (error)
			{
				return callback(error, null);
			}	

			if (sections.length==0)
			{
				return callback(null, []);
			}

			var requiredPermissions = new Objects.RequiredPermissions(eId, true, false);
			var finalLength = sections.length;
			for (var i=sections.length-1; i>=0 ; i--)
			{
				// (function(i, sections, sectionsList) { 
					var section = sections[i];
					
					Permissions.validateSectionLevelPermissions(db, section[OpsConfig.SectionFields.DocumentId], 
						section[OpsConfig.SectionFields.SectionId], requiredPermissions, function(error, isPermitted)
					{
						if (!error && isPermitted==true)
						{
							this.sectionsList.push(this.section);
						}

						if (this.sectionsList.length==this.finalLength)
						{
							// console.log('API_getSectionsForTag', sectionsList);
							return callback(null, this.sectionsList);
						}
					}.bind({i:i, section: section, sectionsList:sectionsList, finalLength: finalLength}));
     			// } (i, sections, sectionsList));
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
// parseJotRecord = function(eId, jotRecord)
// {
// 	if (jotRecord)
// 	{
// 		var permissions= new Objects.Permissions();
// 		permissions.setDocumentPermissions(jotRecord);	

// 		var canRead =  permissions.canRead(eId);
// 		var canWrite = permissions.canWrite(eId);
// 		var isOwner = permissions.isOwner(eId);
// 		var eIdPermissions = {
// 			read: canRead, 
// 			write: canWrite,
// 			isOwner: isOwner
// 		};
// 		jotRecord.permissions=eIdPermissions;		
// 	}
	
// 	return jotRecord;
// }

// getJotUpdateQuery = function(data)
// {
// 	var setupValues=[];

// 	var title = Helpers.getField(data, OpsConfig.JotFields.Title, []);

// 	if (!title.isValid())
// 	{
// 		return null;
// 	}
// 	var setStatement = { };
// 	if (title.isValid())
// 	{
// 		setStatement = { title: title.getValue()};
// 	}

// 	return setStatement;
// }

// permitted_updateJot=function(db, documentId, data, callback)
// {
// 	if (!documentId || !data || !db)
// 	{
// 		var error = Helpers.logError('Internal error with query.', Helpers.INTERNAL_ERROR);
// 		return callback(error, null);
// 	}

// 	var updateQuery = getJotUpdateQuery(data);

// 	if ( updateQuery!=null )
// 	{			
// 		var findQuery = { [OpsConfig.JotFields.DocumentId]: documentId };

// 		Database.SetFieldQuery(db, Database.Tables.Documents, findQuery, updateQuery, null, 
// 			function(error, results)
// 			{
// 				if (error)
// 				{
// 					var error = Helpers.logError('Could not update', Helpers.INTERNAL_ERROR);
// 					return callback(error, null);
// 				}
				
// 				return callback(null, results);
// 			});
// 	}	
// 	else
// 	{
// 		var error = Helpers.logError('Internal error with query.', Helpers.INTERNAL_ERROR);
// 		return callback(error, null);
// 	}		
// }

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

permitted_getTagsFromJots = function(db, jotIds, callback)
{
	// var permissions = permissions.read_write[eId];
	if (!jotIds)
	{
		return callback(null, []);
	}
	var fieldString = OpsConfig.SectionFields.Tags;
	var findQuery = { [OpsConfig.SectionFields.DocumentId]: { $in: jotIds }};

	Database.GetDistinct(
		db, 
		Database.Tables.Sections, 
		fieldString, 
		findQuery, 
		{}, 
		function(error, tags)
	{
		if (error)
		{
			var error = Helpers.logError('Could not find document', Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}

		return callback(null, tags);	
	});
}


getAllTagsFromReadableJots = function(db, eId, callback)
{
	Jots.getAllReadableJots(db, eId, function(error, jots)
	{
		if (error)
		{
			return callback(error, null);
		}

		var jotIds=[];
		for (var i=0; i<jots.length; i++)
		{
			jotIds.push(jots[i][OpsConfig.JotFields.DocumentId]);
		}

		if (jotIds.length==0)
		{
			return callback(null, []);
		}

		permitted_getTagsFromJots(db, jotIds, function(error, tags)
		{
			if (error)
			{
				return callback(error, null);
			}

			return callback(error, tags);
		});
	});

}