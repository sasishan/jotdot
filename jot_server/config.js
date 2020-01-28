var config={};
config.dbURI = "mongodb://127.0.0.1:27017/NoteMaker";  //URL for a mongodb database
config.port =3020;  //Port where honchoHQ will be accessible through
config.COGNITO_CONFIG =
{
    region: 'us-west-2',
    cognitoUserPoolId: 'us-west-2_GLGsA5Q56',
    tokenUse: "access", //Possible Values: access | id
    tokenExpiration: 3600000 //Up to default expiration of 1 hour (3600000 ms)
};

// config.AWS_COGNITO_CONFIG =
// {
//     region: 'us-west-2',
//     userPoolId: 'us-west-2_r1pPxWnDM',
//     tokenUse: ['id', 'access'], //Possible Values: access | id
//     audience: ['55plsi2cl0o267lfusmgaf67pf']
// };

config.S3_CONFIG =
{
    bucket: 'wawesome1',
    awsConfig: {
	  accessKeyId: 'AKIAXIOG6S6QMGOPPFFR',
	  secretAccessKey: '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',
	}
};

module.exports = config;