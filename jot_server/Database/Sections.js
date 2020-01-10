var  Database  = require('../Database/Database')
	,Permissions = require('../Database/Permissions')
	,Helpers  = require('../Helpers')
	,OpsConfig = require('../OperationsConfig')
	,Objects = require('../Objects');

//OPERATION PROCESSORS
exports.Operation_newSection = function(db, eId, data, callback)
{
	if (eId)
	{
		var documentId = Helpers.getField(data, OpsConfig.SectionFields.DocumentId, []);
		if  (!documentId.isValid())
		{
			var error = Helpers.logError('Incorrect fields', Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}	

		var requiredPermissions = new Objects.RequiredPermissions(eId, true, true);
		Permissions.validateDocumentPermissions(db, documentId.getValue(), requiredPermissions, function(error, isPermitted)
		{
			if (error)
			{
				return callback(error, null);
			}

			if (isPermitted!=true)
			{
				var error = Helpers.LogUnauthorizedError();
				return callback(error, null);				
			}

			permitted_addSection(db, eId, data, function(error, results)
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

exports.Operation_deleteSection = function(db, eId, data, callback)
{
	if (eId)
	{
		var documentId = Helpers.getField(data, OpsConfig.SectionFields.DocumentId, []);
		var sectionId = Helpers.getField(data, OpsConfig.SectionFields.SectionId, []);

		if ( documentId.isValid() && sectionId.isValid() )
		{			
			exports.getSection(db, documentId.getValue(), sectionId.getValue(), function(error, section)
			{
				if (error)
				{
					return callback(error, null);
				}

				if (!section)
				{
					return callback(null, {});
				}
				var parentSection = section.parentSection;
				var position = section.position;
				var findQuery = docSectionFind(documentId.getValue(), sectionId.getValue());

				Database.DeleteQuery(db, Database.Tables.Sections, 
					findQuery, {}, 
					function(error, results)
				{
					if (error)
					{
						var error = Helpers.logError('Could not delete', Helpers.INTERNAL_ERROR);
						return callback(error, null);
					}
					
					var findQueryIncrement = 
					{ 
						[OpsConfig.SectionFields.DocumentId]: documentId.getValue(), 
						[OpsConfig.SectionFields.ParentSection]: parentSection,
						[OpsConfig.SectionFields.Position]: { $gt: position }
					};	
					increment = { '$inc':{ [OpsConfig.SectionFields.Position]: -1 }};

					var collection = db.get('Sections');
					collection.update(findQueryIncrement, 
									increment, 
									{ multi: true },
									function(error, result)
					{
						if (error)
						{
							var error = Helpers.logError('Could not decrement values', Helpers.INTERNAL_ERROR);
							return callback(error, null);
						}
						return callback(null, "Deleted");
					});
					
				});				
			});
		}	
		else
		{
			var error = Helpers.logError('Incorrect fields', Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}	
	}
	else
	{
		var error = Helper.logError('Error with id', Helpers.INTERNAL_ERROR);
		return callback(error, null);
	}	
}

exports.Operation_updateSection = function(db, eId, data, callback)
{
	if (eId)
	{
		var documentId = Helpers.getField(data, OpsConfig.SectionFields.DocumentId, []);
		var sectionId = Helpers.getField(data, OpsConfig.SectionFields.SectionId, []);

		if  (!documentId.isValid() || !sectionId.isValid())
		{
			var error = Helpers.logError('Incorrect fields', Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}	

		var requiredPermissions = new Objects.RequiredPermissions(eId, true, true);
		Permissions.validateSectionLevelPermissions(db, documentId.getValue(), sectionId.getValue(), requiredPermissions, function(error, isPermitted)
		{
			if (error)
			{
				return callback(error, null);
			}

			if (isPermitted!=true)
			{
				// var error = Helpers.logError('Not authorized to write to this section', Helpers.UNAUTHORIZED);
				var error = Helpers.LogUnauthorizedError();
				return callback(error, null);				
			}

			var updateQuery = getUpdateQuery(data);

			if ( updateQuery!=null )
			{			
				var findQuery = docSectionFind(documentId.getValue(), sectionId.getValue());

				Database.SetFieldQuery( db, Database.Tables.Sections, findQuery, updateQuery, null, 
				function(error, results)
				{
					if (error)
					{
						var error = Helpers.logError('Could not update', Helpers.INTERNAL_ERROR);
						return callback(error, null);
					}

					permitted_lastUpdatedJot(db, documentId.getValue(), function (error, jot)
					{
						return callback(null, results);
					});
					
					// var findJotQuery = { [OpsConfig.JotFields.DocumentId]: documentId.getValue() };
					// var updateLastUpdated = { lastUpdated: new Date() };
					// Database.SetFieldQuery( 
					// 	db, Database.Tables.Documents, findJotQuery, updateLastUpdated, null, 
					// 	function(error, updatedJot)
					// 	{
					// 		if (error)
					// 		{
					// 			var error = Helpers.logError('Could not update', Helpers.INTERNAL_ERROR);
					// 			return callback(error, null);
					// 		}
							
					// 		return callback(null, results);
					// 	});
				});
			}	
			else
			{
				var error = Helpers.logError('Internal error with query. ', Helpers.INTERNAL_ERROR);
				return callback(error, null);
			}				
		});		

	}
	else
	{
		var error = Helper.logError('Error with id', Helpers.INTERNAL_ERROR);
		return callback(error, null);
	}	
}

//Position and ParentSection
exports.Operation_moveSection = function(db, eId, data, callback)
{
	if (eId)
	{
		var fields = getMoveSectionFields(data);
		if (fields==null)
		{
			var error = Helpers.logError('Incorrect fields', Helpers.INTERNAL_ERROR);
			return callback(error, null);			
		}

		var documentId = fields.documentId;
		var sectionId = fields.sectionId;
		var newPosition = fields.newPosition;
		var newParentSection = fields.newParentSection;

		if ( documentId.isValid() && sectionId.isValid() && newPosition!=null && newParentSection!=null)
		{			
			exports.getSection(db, documentId.getValue(), sectionId.getValue(), function(error, section)
			{
				if (error)
				{
					return callback(error, null);
				}

				var oldPosition = section[OpsConfig.SectionFields.Position];
				var oldParent = section[OpsConfig.SectionFields.ParentSection];

				if (!newParentSection.isValid())
				{
					var error = Helpers.logError('Need parent value', Helpers.INTERNAL_ERROR);
					return callback(error, null);
				}
				
				var moveDirection = getMoveDirection(oldPosition, oldParent, newPosition, newParentSection.getValue());
				if (moveDirection==null)
				{
					return callback(null, {});
				}	

				query = getMoveQuery(documentId, 
									oldPosition, 
									oldParent, 
									newPosition, 
									newParentSection, 
									moveDirection);

				if (query==null)
				{
					return callback(null, {});	
				}

				var collection = db.get('Sections');
				collection.update(query.findQueryIncrement, 
								query.increment, 
								{ multi: true },
								function(error, result)
				{
					if (error)
					{
						var error = Helpers.logError('Could not increment values', Helpers.INTERNAL_ERROR);
						return callback(error, null);
					}
					
					//update the old parent
					if (query.findOldParentQueryIncrement!=null)
					{
						collection.update(query.findOldParentQueryIncrement, 
										query.oldParentIncrement, 
										{ multi: true },
										function(error, result)
						{
							if (error)
							{
								var error = Helpers.logError('Could not increment prior parent values', Helpers.INTERNAL_ERROR);
								// return callback(error, null);
							}
						});
					}

					var findQuery = docSectionFind(documentId.getValue(), sectionId.getValue());

					//update the position
					Database.SetFieldQuery(
						db, 
						Database.Tables.Sections, 
						findQuery,
						query.moveQuery, 
						null, 
					function(error, results)
					{
						if (error)
						{
							var error = Helpers.logError('Could not move the section', Helpers.INTERNAL_ERROR);
							return callback(error, null);
						}
						
						permitted_lastUpdatedJot(db, documentId.getValue(), function (error, jot)
						{
							return callback(null, results);
						});						
						// return callback(null`, results);
					});
				});					
			});
		}	
		else
		{
			var error = Helpers.logError('Incorrect fields ', Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}	
	}
	else
	{
		var error = Helper.logError('Error with id', Helpers.INTERNAL_ERROR);
		return callback(error, null);
	}	
}

//APIs
exports.API_getOneDocumentsSections = function(db, eId, data, callback)
{
	var docId = Helpers.getField(data, OpsConfig.APIPath_JotId, []);

	if (eId && docId.isValid())
	{
		var documentId = docId.getValue();
		var requiredPermissions = new Objects.RequiredPermissions(eId, true, false);
		Permissions.validateDocumentPermissions(db, documentId, requiredPermissions, function(error, isPermitted)
		{
			if (error)
			{
				return callback(error, null);
			}

			if (isPermitted==true)
			{
				buildDocument(db, eId, documentId, function(error, document)
				{
					return callback(error, document);
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

//Permitted changes
permitted_lastUpdatedJot = function(db, documentId, callback)
{
	var findJotQuery = { [OpsConfig.JotFields.DocumentId]: documentId };
	var updateLastUpdated = { lastUpdated: new Date() };
	Database.SetFieldQuery( 
		db, Database.Tables.Documents, findJotQuery, updateLastUpdated, null, 
		function(error, updatedJot)
		{
			if (error)
			{
				var error = Helpers.logError('Could not update Jot', Helpers.INTERNAL_ERROR);
				return callback(error, null);
			}
			
			return callback(null, updatedJot);
		});
};

permitted_addSection = function(db, eId, data, callback)
{
	var orgId='1';
	var documentId = Helpers.getField(data, OpsConfig.SectionFields.DocumentId, []);
	var text = Helpers.getField(data, OpsConfig.SectionFields.Text, []);
	var parent = Helpers.getField(data, OpsConfig.SectionFields.ParentSection, []);
	var priorId = Helpers.getField(data, OpsConfig.SectionFields.PriorId, []);
	
	var sectionId = Helpers.getField(data, OpsConfig.SectionFields.SectionId, []);
	var insertPosition = Helpers.getField(data, OpsConfig.SectionFields.Position, []);

	if ( parent.isValid() && documentId.isValid() )
	{			
		Database.GetMaxMin(db, Database.Tables.Sections, 	
							{ 	
								[OpsConfig.IdFields.DocumentId] : documentId.getValue(), 
								[OpsConfig.SectionFields.ParentSection] : parent.getValue() 
							},
							{ position: -1 }, 
							function(error, results)
		{
			var position=0;
			if (results.length>0)
			{
				position = (results[0].position+1);
			}

			var newSection={};
			var newText = '';
			if (text.isValid())
			{
				newText = text.getValue();
			}

			if (sectionId.isValid())
			{
				newSection= new Objects.SectionWithId(eId, orgId, documentId.getValue(), parent.getValue(), position, newText, priorId.getValue(), sectionId.getValue());
			}
			else
			{
				newSection= new Objects.Section(eId, orgId, documentId.getValue(), parent.getValue(), position, newText, priorId.getValue());
			}

			Database.InsertQuery(db, Database.Tables.Sections, newSection, {}, function(error, results)
			{
				if (error)
				{
					var error = Helpers.logError('Error in query', Helpers.INTERNAL_ERROR);
					return callback(error, null);
				}

				if (insertPosition.isValid())
				{
					if (insertPosition.getValue()<=position)
					{
						newPosition = {
							position: insertPosition.getValue(), 
							parentSection: parent.getValue()
						};
						data[OpsConfig.MoveOperation.NewPosition] = newPosition;

						exports.Operation_moveSection(db, eId, data, function(error, results)
						{
							if (error)
							{
								var error = Helpers.logError('Error in query', Helpers.INTERNAL_ERROR);
								return callback(error, null);
							}

							return callback(null, results);
						});
					}
				}			
				else
				{
					return callback(null, results);
				}
			});				
		});
	}	
	else
	{
		var error = Helpers.logError('Incorrect fields', Helpers.INTERNAL_ERROR);
		return callback(error, null);
	}		
};


//HELPERS
//Pull all the sections for the document, build out the children and order them correctly
buildDocument = function(db, eId, documentId, callback)
{
	//Start with the master which has parentId=null
	var masterParentId=null;
	document = [];

	var collection = db.get('Sections');
	collection.aggregate([
        { 
        	$graphLookup:
        	{
                from:"Sections", 
                startWith:"$id", 
                connectFromField:"id", 
                connectToField:"parentSection", 
                as: "sections",
                depthField: "depth"
            }
        }
        , 
        { $match: {
        	"documentId": documentId, 
        	"eId": eId, 
        	[OpsConfig.SectionFields.ParentSection]: "-1" } }

       //  {$group:{
       //          _id:"$_id", 
       //          parents:{$addToSet:"$myparents._id"}
     		// }}
		],function(err,result) 
		{
      		// console.log(result);
      		// cleanResults(result);
      		buildTree(result);
      		return callback(null, result);
    	});
}

function compare(a,b) 
{
  if (a.position < b.position)
  {
     return -1;
  }

  if (a.position > b.position)
  {
  	return 1;
  }
    
  return 0;
}


buildTree = function(sections)
{
	for (var i=0; i<sections.length; i++)
	{		
		for (var j=sections[i][OpsConfig.SectionFields.Sections].length-1; j>=0; j--)
		{				
			var parent = sections[i][OpsConfig.SectionFields.Sections][j];
			if (!parent)
			{
				continue;
			}

			for (var k=sections[i][OpsConfig.SectionFields.Sections].length-1; k>=0; k--)
			{
				var potentialChild = sections[i][OpsConfig.SectionFields.Sections][k];
				if (parent[OpsConfig.SectionFields.SectionId]==potentialChild[OpsConfig.SectionFields.ParentSection])
				{
					// if (!parent[OpsConfig.SectionFields.Sections])
					// {
					// 	parent[OpsConfig.SectionFields.Sections]=[];
					// }
					parent[OpsConfig.SectionFields.Sections].push(potentialChild);
					potentialChild.child=true;
					// sections[i].sections.splice(k, 1);
				}
			}
		}
	}

	for (var i=0; i<sections.length; i++)
	{		
		for (var j=sections[i][OpsConfig.SectionFields.Sections].length-1; j>=0; j--)
		{
			// for (var k=sections[i].sections.length-1; k>=0; k--)
			// {
				var potentialChild = sections[i][OpsConfig.SectionFields.Sections][j];
				if (potentialChild.child==true)
				{
					sections[i][OpsConfig.SectionFields.Sections].splice(j, 1);
				}
			// }			
			// sections[i].sections.sort(compare);
		}
	}

	orderSections(sections);
}

orderSections = function(sections)
{	
	for (var i=0; i<sections.length; i++)
	{
		var s = sections[i];
		
		if (s[OpsConfig.SectionFields.Sections] && s[OpsConfig.SectionFields.Sections].length>0)
		{
			orderSections(s[OpsConfig.SectionFields.Sections]);	
		}
		// else
	}
	sections.sort(compare);

	return;
}

getUpdateQuery = function(data)
{
	var setupValues=[];

	//fields which may be updated
	var openValue = Helpers.getField(data, OpsConfig.SectionFields.Open, []);
	var textValue = Helpers.getField(data, OpsConfig.SectionFields.Text, []);
	var htmlValue = Helpers.getField(data, OpsConfig.SectionFields.HTML, []);
	var tags = 		Helpers.getField(data, OpsConfig.SectionFields.Tags, []);

	if (!openValue.isValid() && !textValue.isValid())
	{
		return null;
	}

	// var setStatement = { eId: 'XX', orgId: '1'};
	var setStatement = { lastUpdated: new Date() };
	if (tags.isValid())
	{
		setStatement[OpsConfig.SectionFields.Tags]= tags.getValue();
	}
	if (openValue.isValid())
	{
		setStatement[OpsConfig.SectionFields.Open]= openValue.getValue();		
	}
	if (textValue.isValid())
	{
		setStatement[OpsConfig.SectionFields.Text]= textValue.getValue();
		setStatement[OpsConfig.SectionFields.HTML]= htmlValue.getValue();
	}

	return setStatement;
}

exports.permitted_getSectionsByTag = function(db, eId, tags, callback)
{
	var findQuery = {tags: tags};

	console.log(findQuery);
	Database.GetQuery(
		db, 
		Database.Tables.Sections, 
		findQuery, 
		{}, 
		function(error, sections)
	{
		if (error)
		{
			var error = Helpers.logError('Error finding section by tag', Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}

		return callback(null, sections);	
	});
}

exports.getSection = function(db, documentId, sectionId, callback)
{
	var findQuery = docSectionFind(documentId, sectionId);

	Database.GetQuery(
		db, 
		Database.Tables.Sections, 
		findQuery, 
		{}, 
		function(error, section)
	{
		if (error)
		{
			var error = Helpers.logError('Could not find section', Helpers.INTERNAL_ERROR);
			return callback(error, null);
		}
		return callback(null, section[0]);	
	});
}

getMoveSectionFields=function(data)
{
	var fields={};
	fields.documentId = Helpers.getField(data, OpsConfig.SectionFields.DocumentId, []);
	fields.sectionId = Helpers.getField(data, OpsConfig.SectionFields.SectionId, []);

	var newPositionData = Helpers.getField(data, OpsConfig.MoveOperation.NewPosition, []);
	if (!newPositionData.isValid())
	{
		return null;		
	}
	fields.newPosition = Helpers.getField(newPositionData.getValue(), OpsConfig.SectionFields.Position, []);
	fields.newParentSection = Helpers.getField(newPositionData.getValue(), OpsConfig.SectionFields.ParentSection, []);
	return fields;
}

getMoveDirection = function(oldPosition, oldParent, newPosition, newParent)
{
	if (oldPosition==newPosition.getValue() && oldParent==newParent)
	{
		return null;
	}

	var moveDirection = OpsConfig.MOVE_UPSTREAM; //moving upstream
	if (newPosition.getValue() > oldPosition)
	{
		moveDirection = OpsConfig.MOVE_DOWNSTREAM; //moving downstream
	}

	return moveDirection;
}

getMoveQuery = function(documentId, oldPosition, oldParentSectionId, newPosition, newParentSection, moveDirection)
{
	var moveQuery = {};
	moveQuery[OpsConfig.SectionFields.Position]= newPosition.getValue();
	if (newParentSection.isValid())
	{		
		moveQuery[OpsConfig.SectionFields.ParentSection]= newParentSection.getValue();	
	}
	else
	{
		return null; // need a newParentSection to do
	}

	var findQueryIncrement = {};
	var increment = {};
	var findOldParentQueryIncrement={};
	var OldParentIncrement={};
	if (newParentSection.getValue()!=oldParentSectionId)
	{
		findOldParentQueryIncrement = 
		{ 
			[OpsConfig.SectionFields.DocumentId]: documentId.getValue(), 
			[OpsConfig.SectionFields.ParentSection]: oldParentSectionId,
			[OpsConfig.SectionFields.Position]: {  $gt: oldPosition }
		};	
		oldParentIncrement = { '$inc':{ [OpsConfig.SectionFields.Position]: -1 }};
		moveDirection = OpsConfig.APPEND;
	}
	else
	{
		findOldParentQueryIncrement=null;
		oldParentIncrement=null;
		
	}

	if (moveDirection==OpsConfig.MOVE_UPSTREAM)
	{
		findQueryIncrement = 
		{ 
			[OpsConfig.SectionFields.DocumentId]: documentId.getValue(), 
			[OpsConfig.SectionFields.ParentSection]: newParentSection.getValue(),
			'$and' : [ 
					{ [OpsConfig.SectionFields.Position]: { $gte: newPosition.getValue()} }, 
					{ [OpsConfig.SectionFields.Position]: { $lt: oldPosition} }]
		};				
		increment = { '$inc':{ [OpsConfig.SectionFields.Position]: 1 }};	

	}
	else if (moveDirection==OpsConfig.MOVE_DOWNSTREAM)
	{
		findQueryIncrement = 
		{ 
			[OpsConfig.SectionFields.DocumentId]: documentId.getValue(), 
			[OpsConfig.SectionFields.ParentSection]: newParentSection.getValue(),
			'$and' : [ 
					{ [OpsConfig.SectionFields.Position]: { $lte: newPosition.getValue()} }, 
					{ [OpsConfig.SectionFields.Position]: { $gt: oldPosition} }]
		};	
		increment = { '$inc':{ [OpsConfig.SectionFields.Position]: -1 }};
	}
	else
	{
		findQueryIncrement = 
		{ 
			[OpsConfig.SectionFields.DocumentId]: documentId.getValue(), 
			[OpsConfig.SectionFields.ParentSection]: newParentSection.getValue()
		};	
		increment = { '$inc':{ [OpsConfig.SectionFields.Position]: 0 }};		
	}

	return { 
		moveQuery: moveQuery, 
		findQueryIncrement:findQueryIncrement, 
		increment: increment, 
		findOldParentQueryIncrement: findOldParentQueryIncrement,
		oldParentIncrement: oldParentIncrement,
		moveDirection:moveDirection
	};
}

docSectionFind = function(documentId, sectionId)
{
	var q = { 	[OpsConfig.SectionFields.DocumentId]: documentId, 
					[OpsConfig.SectionFields.SectionId]: sectionId 
				};
		return q;

}

