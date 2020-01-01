var  Objects = require('../Objects')
	,Database  = require('../Database');


createNewDocument = function(db, callback)
{
	var eId=req.eId;
	if (eId)
	{
		var newDoc= new Objects.Document();
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
