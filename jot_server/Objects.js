var  ObjectId = require('mongodb').ObjectID;
	// ,Processors = require('./Processors');

var Objects={};
Objects.RequiredPermissions = function(eId, needRead, needWrite)
{
  this.eId={};
  this.needRead={};
  this.needWrite={}; 

  this.eId = eId;
  this.needRead = needRead;
  this.needWrite = needWrite;
}

Objects.Permissions = function()
{
  this.documentId=undefined;
  this.sectionId=undefined;
  this.permissions={};
  this.read={};
  this.write={};
  this.append={};
  this.ownerEID=undefined;

  this.setDocumentPermissions = function(docRecord)
  {
    this.setOwner(docRecord.eId);
    this.documentId = docRecord.documentId;
    if (docRecord.sectionId)
    {
      this.sectionId = docRecord.sectionId;
    }
    this.permissions = docRecord.permissions;

    for (var i=0; i<this.permissions.read.length; i++)
    {
      this.grantRead(this.permissions.read[i]);
    }

    for (var i=0; i<this.permissions.write.length; i++)
    {
      this.grantWrite(this.permissions.write[i]);
    }    
  }

  this.setOwner = function(eId)
  {
    this.ownerEID=eId;
  }

  this.grantRead = function(eId)
  {
    this.read[eId] = true;
  };

  this.grantWrite = function(eId)
  {
    this.write[eId] = true;
  };

  this.canWrite = function(eId)
  {
    if (this.ownerEID==eId || this.write[eId])
    {
      return true;
    }
    else
    {
      return false;
    }
  };

  this.canRead = function(eId)
  {
    if (this.ownerEID==eId || this.read[eId])
    {
      return true;
    }
    else
    {
      return false;
    }
  };
};

Objects.Document = function(eId, orgId, title)
{
  this.documentId = new ObjectId().toHexString();
  this.title = title;
  this.created = new Date();
  this.lastUpdated = this.created;
  this.eId = eId;
  this.orgId = orgId;
  this.permissions={
    read:[],
    write:[]
  }

}

Objects.Section = function(eId, orgId, documentId, parent, position, text, priorId)
{
  this.id = new ObjectId().toHexString();
  this.documentId = documentId;
  this.priorId = priorId;
  this.eId = eId;
  this.orgId = orgId;

  this.text = text;
  this.html = text;
  this.parentSection = parent;
  this.position = position;
  this.open = true;
  this.sections=[];
}

Objects.SectionWithId = function(eId, orgId, documentId, parent, position, text, priorId, sectionId)
{
  Objects.Section.call(this, eId, orgId, documentId, parent, position, text, priorId);
  this.id = sectionId;

  // this.documentId = documentId;
  // this.priorId = priorId;

  // this.text = text;
  // this.html = text;
  // this.parentSection = parent;
  // this.position = position;
  // this.open = true;
  // this.sections=[];
}


Objects.Operation = function(type, data)
{
  this.operationId = new ObjectId().toHexString();
  this.type = type;
  this.data = data;

  this.process = undefined;
}


Objects.RESTField = function(fieldName, fieldValue, isValid, isFound)
{
	this.found= isFound; 
	this.valid =  isValid;
	this.fieldName= fieldName;
	this.fieldValue= fieldValue;

	this.isValid = function()
	{
		return (this.valid && this.found);
	};

	this.getValue = function()
	{
		return this.fieldValue;
	}
}

module.exports = Objects;
