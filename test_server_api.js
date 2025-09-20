const http = require('http');

function getProfileFromServer(userId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: `/users/${userId}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function testServerAPI() {
    try {
        console.log('Calling server API for rikke@jetbond.com...');
        const profile = await getProfileFromServer('rikke@jetbond.com');
        console.log('Profile from server:');
        console.log(JSON.stringify(profile, null, 2));
    } catch (error) {
        console.error('Error calling server API:', error.message);
    }
}

testServerAPI();