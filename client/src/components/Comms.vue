<script>
import { Auth } from 'aws-amplify';
import io from "socket.io-client";

const axios = require('axios');

function getToken(session)
{
	if (session && session.accessToken)
	{
		return session.accessToken.jwtToken;
	}
	else
	{
		return '';
	}
}

function getEmail(session)
{
	if (session && session.idToken.payload.email)
	{
		return session.idToken.payload.email
	}
	else
	{
		return '';
	}
}

async function getAnonymousHeader()
{
	var headers =
    {
        // 'Authorization': session.idToken.jwtToken, 
        'content-type': 'application/json',
	};
	return headers;
}

async function getHeader()
{
	const session = await Auth.currentSession();			
	var headers =
    {
        'Authorization': session.idToken.jwtToken, 
        'AccessToken': getToken(session),
        'content-type': 'application/json',
        'email': getEmail(session)
	};
	return headers;
}

async function getFileHeader()
{
	const session = await Auth.currentSession();			
	var headers =
    {
        'Authorization': session.idToken.jwtToken, 
        'AccessToken': getToken(session),
        'content-type': 'multipart/form-data',
        'email': getEmail(session)
	};
	return headers;
}

export default 
{
	name: 'Comms',
	async wsEmit(socket, eventType, data)
	{
		// var socket = io.connect(url);
		// socket.emit('pingServer', {data: 'Ping!'});
		console.log(eventType);
		try 
		{
			var headers = await getHeader();
			socket.emit(eventType,  { header: headers, data: data });
		}
		catch (err) 
		{
			console.log('An error occurred: ', err);
		}		
	},
	async anonymousPost(url, data, callback)
	{
		try 
		{
			var headers = getAnonymousHeader();
			var response = await axios.post(url, data, {headers: headers});

			var results = response.data;
			return callback(null, results);
		}
		catch (err) 
		{
			console.log('An error occurred: ', err);
			return callback(err, null);
		}
	},	
	async post(url, data)
	{
		var headers = await getHeader();
		return new Promise(function(resolve, reject) 
		{
			try 
			{
				axios.post(url, data, {headers: headers}).then(function(response)
				{
					var results = response.data;
					resolve(results);
				}, function(error)
				{
					console.log('An error occurred: ', error);
					resolve(null);
				});
			}
			catch (err) 
			{
				console.log('A reject error occurred: ', err);
				reject(err);
			}		
		});

		// try 
		// {
		// 	var headers = await getHeader();
		// 	var response = await axios.post(url, data, {headers: headers});

		// 	var results = response.data;
		// 	return callback(null, results);
		// }
		// catch (err) 
		// {
		// 	console.log('An error occurred: ', err);
		// 	return callback(err, null);
		// }
	},	
	async getFile(url, callback)
	{
		try 
		{
			// var headers = await getHeader();
			var response = await axios.get(url, {responseType: 'blob',timeout: 30000});
			var results = response.data;
			return callback(null, results);

		}
		catch (err) 
		{
			console.log('An error occurred: ', err);
			return callback(err, null);
		}
	},
	async postFile(url, data, callback)
	{
		try 
		{
			var headers = await getFileHeader();
			var response = await axios.post(url, data, {headers: headers});

			var results = response.data;
			return callback(null, results);

		}
		catch (err) 
		{
			console.log('An error occurred: ', err);
			return callback(err, null);
		}
	},	
	async anonymousGet(url)
	{
		var headers = getAnonymousHeader();
		return new Promise(function(resolve, reject) 
		{
			try 
			{
				axios.get(url, {headers: headers}).then(function(response)
				{
					var results = response.data;
					resolve(results);
				}, function(error)
				{
					console.log('An error occurred: ', error);
					reject(error);
				});
			}
			catch (err) 
			{
				console.log('An error occurred: ', err);
				reject(err);
			}		
		});		
	},			
	async get(url)
	{
		var headers = await getHeader();
		return new Promise(function(resolve, reject) 
		{
			try 
			{
				axios.get(url, {headers: headers}).then(function(response)
				{
					var results = response.data;
					resolve(results);
				}, function(error)
				{
					console.log('An error occurred: ', error);
					reject(error);
				});
			}
			catch (err) 
			{
				console.log('An error occurred: ', err);
				reject(err);
			}		
		});
	},
	async delete(url, callback)
	{
		try 
		{
			var headers = await getHeader();
			var response = await axios.delete(url, {headers: headers});

			var results = response.data;
			return callback(null, results);

		}
		catch (err) 
		{
			console.log('An error occurred: ', err);
			return callback(err, null);
		}
	},	
	components: 
	{
	}, 	
	methods: 
	{

	},

}

</script>