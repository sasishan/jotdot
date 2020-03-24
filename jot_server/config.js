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



config.S3_CONFIG =
{

};

module.exports = config;
