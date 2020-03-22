var OpsConfig={};

OpsConfig.Permissions_Read = 'permissions.read';
OpsConfig.Permissions_Write = 'permissions.write';
OpsConfig.Permissions_IsPublic = 'permissions.isPublic';
// OpsConfig.Permissions_Read_Write = 'permissions.read_write'

OpsConfig.ValidOperationsTypes = 
{
    CreateDocument: 'CreateDocument',
    DeleteDocument: 'DeleteDocument',
    CreateSection: 'NewSection',
    DeleteSection:'DeleteSection',
    UpdateSection:'UpdateSection',
    MoveSection:'MoveSection',
    UpdateJot:'UpdateJot',
};

OpsConfig.OperationFields=
{
    Type: 'type',
    Data: 'data',
    Timestamp: 'timestamp'
};

OpsConfig.JotFields=
{
    EmployeeId: 'eId',
    OrgId: 'orgId',
    DocumentId: 'documentId',
    Title: 'title',
    isShared: 'isShared', 
    isPublic: 'isPublic'
};


OpsConfig.SectionFields=
{
    EmployeeId: 'eId',
    OrgId: 'orgId',
    Text: 'text',
    HTML: 'html',
    SectionId: 'id',
    DocumentId: 'documentId',
    ParentSection: 'parentSection',
    Position: 'position',
    Sections: 'sections',
    Open: 'open',
    Tags: 'tags',
    PriorId : 'priorId',
    Lock : 'lock',
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
OpsConfig.CROSS_STREAM = 2;
OpsConfig.APPEND = 0;

OpsConfig.APIPath_JotId = "jotId";
OpsConfig.APIPath_TagName = "tag";

OpsConfig.APIPaths=
{
    GET_OneJotsSections: '/api/v1/documents/:' + OpsConfig.APIPath_JotId,
    GET_AllJots:'/api/v1/documents',
    GET_OneJot:'/api/v1/jots/:' + OpsConfig.APIPath_JotId,
    POST_NewJot: '/api/v1/jots',
    DELETE_OneJot:'/api/v1/jots/delete/:'+ OpsConfig.APIPath_JotId,
    GET_AllTags: '/api/v1/tags',
    GET_TagSections: '/api/v1/tags/:'+OpsConfig.APIPath_TagName,

    GET_ANONYMOUS_AllJots: '/api/v1/anonymous/documents',
    GET_ANONYMOUS_OneJotsSections: '/api/v1/anonymous/documents/:'+ OpsConfig.APIPath_JotId,
    GET_ANONYMOUS_OneJot: '/api/v1/anonymous/jots/:'+ OpsConfig.APIPath_JotId,
};

OpsConfig.GET_AllDocuments_Projection= { projection: {documentId: 1, title: 1, permissions: 1, eId: 1 , created:1, isPublic:1, isShared:1, lastUpdated:1, _id: 0}};
OpsConfig.GET_Sections_Projection= { projection: {documentId: 1, text: 1, permissions: 1, eId: 1 , _id: 0}};

module.exports = OpsConfig;