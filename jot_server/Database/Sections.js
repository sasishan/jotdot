var  Database  = require('../Database/Database')
	,Helpers  = require('../Helpers')
	,OpsConfig = require('../OperationsConfig')
	,Objects = require('../Objects');

//OPERATION PROCESSORS
exports.updateJot = function(db, eId, data, callback)
{
	if (eId)
	{
		var jotId = Helpers.getField(data, OpsConfig.SectionFields.DocumentId, []);

		if ( jotId.isValid() )
		{
			var documentId = jotId.getValue();
			var requiredPermissions = new Objects.RequiredPermissions(eId, true, true);
			validateDocumentPermissions(db, documentId, requiredPermissions, function(error, isPermitted)
			{
				if (error)
				{
					return callback(error, null);
				}

				if (isPermitted==true)
				{
					var updateQuery = getJotUpdateQuery(data);

					if ( updateQuery!=null )
					{			
						var findQuery = { [OpsConfig.JotFields.DocumentId]: documentId };

						Database.SetFieldQuery( 
							db, Database.Tables.Documents, findQuery, updateQuery, null, 
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
						var error = Helpers.logError('Internal error with query. ', Helpers.INTERNAL_ERROR);
						return callback(error, null);
					}			
				}
				else
				{
					var error = Helpers.logError('Not authorized to view this document', Helpers.UNAUTHORIZED);
					return callback(error, null);
				}
			});				
		}
	}
	else
	{
		console.log('Error with id');
		return callback('Error with id', null);
	}	
}


exports.getDocuments = function(db, eId, data, callback)
{
	if (eId)
	{
		getAllReadableDocuments(db, eId, function(error, docs)
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

//APIs
exports.createDocument = function(db, eId, data, callback)
{
	if (eId)
	{
		var orgId = '1';
		var title='Untitled';
		if (data.title)
		{
			title = data.title;
		}
		var newDoc= new Objects.Document(eId, orgId, title);
		Database.InsertQuery(db, Database.Tables.Documents, newDoc, {}, function(error, results)
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

exports.getOneJot = function(db, eId, data, callback)
{
	var jotId = Helpers.getField(data, "jotId", []);

	if (eId && jotId.isValid())
	{
		var documentId = jotId.getValue();
		var requiredPermissions = new Objects.RequiredPermissions(eId, true, false);
		validateDocumentPermissions(db, documentId, requiredPermissions, function(error, isPermitted)
		{
			if (error)
			{
				return callback(error, null);
			}

			if (isPermitted==true)
			{
				permitted_getDocumentRecord(db, null, documentId, function(error, docRecord)
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
				var error = Helpers.logError('Not authorized to view this document', Helpers.UNAUTHORIZED);
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


exports.getOneDocumentsSections = function(db, eId, data, callback)
{
	var docId = Helpers.getField(data, "docId", []);

	if (eId && docId.isValid())
	{
		var documentId = docId.getValue();
		var requiredPermissions = new Objects.RequiredPermissions(eId, true, false);
		validateDocumentPermissions(db, documentId, requiredPermissions, function(error, isPermitted)
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
				var error = Helpers.logError('Not authorized to view this document', Helpers.UNAUTHORIZED);
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

//Permitted change
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

						exports.moveSection(db, eId, data, function(error, results)
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

permitted_getDocumentRecord = function(db, eId, documentId, callback)
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

exports.newSection = function(db, eId, data, callback)
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
		validateDocumentPermissions(db, documentId.getValue(), requiredPermissions, function(error, isPermitted)
		{
			if (error)
			{
				return callback(error, null);
			}

			if (isPermitted!=true)
			{
				var error = Helpers.logError('Not authorized to write to this document', Helpers.UNAUTHORIZED);
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

exports.deleteSection = function(db, eId, data, callback)
{
	if (eId)
	{
		var documentId = Helpers.getField(data, OpsConfig.SectionFields.DocumentId, []);
		var sectionId = Helpers.getField(data, OpsConfig.SectionFields.SectionId, []);

		if ( documentId.isValid() && sectionId.isValid() )
		{			
			getSection(db, documentId, sectionId, function(error, section)
			{
				if (error)
				{
					return callback(error, null);
				}

				var parentSection = section.parentSection;
				var position = section.position;
				var findQuery = docSectionFind(documentId, sectionId);

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

exports.updateSection = function(db, eId, data, callback)
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
		validateSectionLevelPermissions(db, documentId, sectionId, requiredPermissions, function(error, isPermitted)
		{
			if (error)
			{
				return callback(error, null);
			}

			if (isPermitted!=true)
			{
				var error = Helpers.logError('Not authorized to write to this section', Helpers.UNAUTHORIZED);
				return callback(error, null);				
			}

			var updateQuery = getUpdateQuery(data);
			console.log(updateQuery);

			if ( updateQuery!=null )
			{			
				var findQuery = docSectionFind(documentId, sectionId);

				Database.SetFieldQuery( db, Database.Tables.Sections, findQuery, updateQuery, null, 
				function(error, results)
				{
					if (error)
					{
						var error = Helpers.logError('Could not update', Helpers.INTERNAL_ERROR);
						return callback(error, null);
					}
					
					var findJotQuery = { [OpsConfig.JotFields.DocumentId]: documentId.getValue() };
					var updateLastUpdated = { lastUpdated: new Date() };
					Database.SetFieldQuery( 
						db, Database.Tables.Documents, findJotQuery, updateLastUpdated, null, 
						function(error, updatedJot)
						{
							if (error)
							{
								var error = Helpers.logError('Could not update', Helpers.INTERNAL_ERROR);
								return callback(error, null);
							}
							
							return callback(null, results);
						});
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
exports.moveSection = function(db, eId, data, callback)
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
			getSection(db, documentId, sectionId, function(error, section)
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

					var findQuery = docSectionFind(documentId, sectionId);

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
						
						return callback(null, results);
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
        { $match: {"documentId": documentId, "eId": eId, parentSection: "-1" } }

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

parseJotRecord = function(eId, doc)
{
	if (doc)
	{
		var permissions= new Objects.Permissions();
		permissions.setDocumentPermissions(doc);	

		var canRead =  permissions.canRead(eId);
		var canWrite = permissions.canWrite(eId);
		var eIdPermissions = {
			read: canRead, 
			write: canWrite
		};
		doc.permissions=eIdPermissions;		
	}
	
	return doc;
}



getSection = function(db, documentId, sectionId, callback)
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
		console.log('getSection',findQuery, section[0]);
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
	if (documentId.isValid() && sectionId.isValid())
	{
		var q = { 	[OpsConfig.SectionFields.DocumentId]: documentId.getValue(), 
					[OpsConfig.SectionFields.SectionId]: sectionId.getValue() 
				};
		return q;
	}
	else
	{
		return null;
	}
}

getAllReadableDocuments = function(db, eId, callback)
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

validateSectionLevelPermissions = function(db, documentIdObject, sectionIdObject, requiredPermissions, callback)
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

		validateDocumentPermissions(db, documentIdObject.getValue(), requiredPermissions, function(error, isPermittedAtDocLevel)
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

//requiredPermissions.needRead/needWrite
validateDocumentPermissions=function(db, documentId, requiredPermissions, callback)
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
// getPermissionsNeeded = function(eId, documentId)
// {

// };

// validateDocumentPermissions= function(db, eId, documentId, permissionsNeed, callback)
// {
// 	getDocumentRecord(db, null, documentId, function(error, docRecord)
// 	{
// 		if (error || docRecord.length==0)
// 		{
// 			return callback(error, null);
// 		}
// 		var permissions= new Objects.Permissions();

// 		readPermissions= false;
// 		if (permissionsNeeded.read)
// 		{
// 			if (docRecord.permissions.read
// 		}
// 		return callback(null, permissions);
// 	});	
// }

getDocumentPermissions=function(db, documentId, callback)
{
	permitted_getDocumentRecord(db, null, documentId, function(error, docRecord)
	{
		if (error || docRecord.length==0)
		{
			return callback(error, null);
		}

		var permissions= new Objects.Permissions();
		permissions.setDocumentPermissions(docRecord[0]);
		// console.log(permissions);

		return callback(null, permissions);
	});	
}
