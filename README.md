# Apiary Dynamic API Mock Server 

Creates a mock server from a [Blueprint API file](https://github.com/apiaryio/api-blueprint) with the posibility to dynamically bind Javascript function to API routes for dynamic content.

## Installing
        git clone https://github.com/nicupavel/blueprint-dynamic-mock.git
        cd blueprint-dynamic-mock
        npm install

## Using
1. Add or download your Apiary/Blueprint API file (usually with .apib or .md extension)
2. Edit *config.json* and set the path to the above API file
3. Start mock server: ```npm run start```
4. Test: ```curl -X GET http://127.0.0.1:19090/api/4/machine/time```
   
## Customising
1. Edit *user/aliases.json* and create any aliases for api routes if needed
2. Edit *user/responses.json* and add any dynamic responses that you need for API calls. If none defined the static response from API file is returned. See responses.json for an example.
   

## In depth example
This project is used in [RainMachine Web UI Demo](https://demo.labs.rainmachine.com) to mock the entire [RainMachine API](https://github.com/nicupavel/rainmachine-api). *rainmachine* branch has the entire example that is used live.
To run RainMachine example:
```
git checkout origin/rainmachine -b rainmachine
git submodule update --init --recursive
npm run start
```


