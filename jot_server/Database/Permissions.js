var  Database  = require('../Database/Database')
	,Helpers  = require('../Helpers')
	,OpsConfig = require('../OperationsConfig')
	,Objects = require('../Objects')
	,Jots  = require('../Database/Jots');


//requiredPermissions.needRead/needWrite
exports.validateDocumentPermissions=function(db, documentId, requiredPermissions, callback)
{
	getDocumentPermissions(db, documentId, function(error, docPermissions)
	{
		if (error)
		{
			var error = Helpers.logError('Error getting permissions', Helpers.INTERNAL_ERROR);
			return callback(error, null);			
		}

		var hasRequiredPermissions = validateHasRequiredPermissions(requiredPermissions, docPermissions);
		if (hasRequiredPermissions!=null)
		{
			return callback(null, hasRequiredPermissions);				
		}
		else
		{
			var error = Helpers.logError('Error with document permissions', Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}
	});
}

exports.validateSectionLevelPermissions = function(db, documentIdObject, sectionIdObject, requiredPermissions, callback)
{
	//if doc level has read/write permissions then user can read/write all sections of the doc
	//if doc level does not have read but section has read, then has requirements for read otw no
	//if doc level does not have write but section has write, then has requirements for write otw no
	//
	getSection(db, documentIdObject, sectionIdObject, function(error, section)
	{
		//get the section to make sure we get the right document ID that cant be spoofed
		if (error || !section)
		{
			console.log('ERROR validateSectionLevelPermissions ', documentIdObject, sectionIdObject, section);
			return callback(error, null);			
		}

		exports.validateDocumentPermissions(db, documentIdObject.getValue(), requiredPermissions, function(error, isPermittedAtDocLevel)
		{
			if (error)
			{
				return callback(error, null);
			}

			if (isPermittedAtDocLevel ||  (!section.permissions))
			{
				return callback(null, isPermittedAtDocLevel);
			}

			var permissions= new Objects.Permissions();
			permissions.setDocumentPermissions(section);

			var hasRequiredPermissions = validateHasRequiredPermissions(requiredPermissions, docPermissions);
			if (hasRequiredPermissions)
			{
				return callback(null, hasRequiredPermissions);				
			}
			else
			{
				var error = Helpers.logError('Error with document permissions', Helpers.INTERNAL_ERROR);
				return callback(error, null);
			}

			return callback(null, permissions);			
		});

	});
}

getDocumentPermissions=function(db, jotId, callback)
{
	Jots.permitted_getJotRecord(db, null, jotId, function(error, jotRecord)
	{
		if (error || jotRecord.length==0)
		{
			return callback(error, null);
		}

		var permissions= new Objects.Permissions();
		permissions.setDocumentPermissions(jotRecord[0]);
		// console.log(permissions);

		return callback(null, permissions);
	});	
}


validateHasRequiredPermissions = function(requiredPermissions, permissions)
{
	if (permissions && requiredPermissions.eId) 
	{
		var hasRequiredPermissions= true;

		var eId = requiredPermissions.eId;
		if (requiredPermissions.needRead)
		{
			if (permissions.canRead(eId))
			{
				hasRequiredPermissions=true;
			}
			else
			{
				hasRequiredPermissions=false;
			}
		}
		
		if (requiredPermissions.needWrite)
		{
			if (permissions.canWrite(eId))
			{
				hasRequiredPermissions=true;
			}
			else
			{
				hasRequiredPermissions=false;
			}
		}

		return hasRequiredPermissions;
	}
	else
	{
		return null;
	}
}