var OpsConfig={};

var text = 'text';
var HTML = 'html';
var id= 'id';
var documentId = 'documentId';
var parentSection= 'parentSection';
var position = 'position';
var sections = 'sections';
var open= 'open';
var priorId='priorId';
var newPositionData = 'newPositionData';
var tags = 'tags';
var title='title';

OpsConfig.ValidOperationsTypes = 
{
    CreateDocument: 'CreateDocument',
    DeleteDocument: 'DeleteDocument',
    CreateSection: 'NewSection',
    DeleteSection:'DeleteSection',
    UpdateSection:'UpdateSection',
    MoveSection: 'MoveSection',
    UpdateJot: 'UpdateJot'
};

OpsConfig.ValidClientOperations=
{
    AddSection : 'addSection',
    MoveSection: 'addExistingSection',
    UpdateSectionText: 'updateSectionText',
    OpenCloseSection: 'openCloseSection', 
    DeleteSection: 'deleteBlankSection',
    UpdateJotTitle: 'updateJotTitle'
}

//FIELDS STORED in DB
OpsConfig.SectionFields=
{
    Text: text,
    HTML: HTML,
    SectionId: id,
    DocumentId: documentId,
    ParentSection: parentSection,
    Position: position,
    Sections: sections,
    Open: open,
    PriorId : priorId
};

//BASIC OPERATION FIELDS - ALL OPS SHOULD HAVE THIS
OpsConfig.OperationFields=
{
    Type: 'type',
    Data: 'data',
    Timestamp: 'timestamp'
};

OpsConfig.Operation=function(type, docId, sectionId)
{
    //Basic fields for all ops
    this[OpsConfig.OperationFields.Data]={};
    this[OpsConfig.OperationFields.Timestamp]=new Date();
    this[OpsConfig.OperationFields.Type]=type;
    this[OpsConfig.OperationFields.Data][id]=sectionId;
    this[OpsConfig.OperationFields.Data][documentId]=docId;
}

OpsConfig.NewSectionOperation=function(documentId, sectionId, textVal, htmlVal, parentSectionVal, positionVal)
{
    OpsConfig.Operation.call(this, OpsConfig.ValidOperationsTypes.CreateSection, documentId, sectionId);

    this[OpsConfig.OperationFields.Data][HTML] = htmlVal;
    this[OpsConfig.OperationFields.Data][text] = textVal;        
    this[OpsConfig.OperationFields.Data][parentSection] = parentSectionVal;
    if (positionVal!=null && positionVal!=undefined && positionVal>=0)
    {
        this[OpsConfig.OperationFields.Data][position] = positionVal;
    }
}

OpsConfig.MoveSectionOperation=function(docId, sectionId, parentSectionVal, positionVal)
{
    OpsConfig.Operation.call(this, OpsConfig.ValidOperationsTypes.MoveSection, docId, sectionId);
    this[OpsConfig.OperationFields.Data][newPositionData] = 
    {
        position:positionVal,
        parentSection:parentSectionVal
    }
}

OpsConfig.UpdateTextOperation = function(docId, sectionId, newText, newHtml, sectionTags)
{
    OpsConfig.Operation.call(this, OpsConfig.ValidOperationsTypes.UpdateSection, docId, sectionId);
    this[OpsConfig.OperationFields.Data][text] = newText;
    this[OpsConfig.OperationFields.Data][HTML] = newHtml;
    this[OpsConfig.OperationFields.Data][tags] = sectionTags;        
}

OpsConfig.UpdateOpenCloseOperation = function(docId, sectionId, newOpen)
{
    OpsConfig.Operation.call(this, OpsConfig.ValidOperationsTypes.UpdateSection, docId, sectionId);
    this[OpsConfig.OperationFields.Data][open] = newOpen;
}

OpsConfig.DeleteOperation= function(docId, sectionId)
{
    OpsConfig.Operation.call(this, OpsConfig.ValidOperationsTypes.DeleteSection, docId, sectionId);
}

OpsConfig.UpdateJotTitleOperation=function(documentId, newTitle)
{
    OpsConfig.Operation.call(this, OpsConfig.ValidOperationsTypes.UpdateJot, documentId, null);

    this[OpsConfig.OperationFields.Data][title] = newTitle;        
}

OpsConfig.MoveOperation=
{
    NewPosition: 'newPositionData',
};

OpsConfig.UpdateOperation=
{
    AttributeUpdated: 'attribute',
};

OpsConfig.MoveOperation=
{
    NewPosition: 'newPositionData',
};

OpsConfig.IdFields=
{
    DocumentId :'documentId',
    SectionId: 'id'
};


OpsConfig.MOVE_UPSTREAM = 1;
OpsConfig.MOVE_DOWNSTREAM = -1;
OpsConfig.APPEND = 0;

module.exports = OpsConfig;