# About
This is a CLI utility to interact with Azure Blob Storage. The utility requires configuration parameters in config.yaml file.
The configuration parameters include -

### Required parameters  
1. **url** :  
azure storage url
2. **account** :  
storage account to communicate with azure blob storage
3. **key** :  
this is the account key used to authenticate and communicate with azure blob storage  

**NOTE:** above parameters are necessary and sufficient to perform all operations with azure blob storage.   

### Optional parameters  
1. **sasValidityDuration** :  
this defines the validity(in minutes) of token generated for authentication, for long operations this should be set to a higher number 
2. **maxRetries** :  
this is the number of retries that will be done in case an operation fails
3. **retryInterval** :  
the interval between successive retries(in seconds)
4. **skipTLSVerification** :  
this disables cert verification while establishing connection. To run locally disable it.

### special parameters
1. **fileList** :   
list of files, used as a reference for downloading reports from storage. All files added to this list can be download in one go.


A sample configuration is present in config.yaml for reference.

## Operations
The CLI utility can support following operations -
1. Create/delete storage container
2. Upload file to blob storage
3. Download single/multiple files from blob storage

## Building CLI utility

### Pre-requisites
1. one should require nodeJS and npm installed. Refer: https://nodejs.org/en/download for node installation
2. additionally, to build from Makefile, you will require `make` installed on your environment
3. install node modules with `make install`

### Steps
1. to create a build, run `make build` on shell.
2. the build should be available in build directory under the name `abc` (azure blob cli)
3. **[Optional]** you can move `abc` and config.yaml into desired folder and add it to the `PATH` to use it from shell.

## Examples 
 1.  create container:  
    `abc create-container -n test-container` **OR** `abc create-container --name test-container`
 2. delete container:  
    `abc delete-container -n test-container` **OR** `abc delete-container --name test-container`
 3. download single file:  
    `abc download -n test-container -b may_25 -f barclays` **OR** `abc download --name test-container --blob may_25 --file barclays`
 4. download all files from a blob:  
    `abc download -n test-container -b may_25` **OR** `abc download --name test-container --blob may_25`
 5. upload file to blob:  
    `abc upload -n test-container -b may_25 -f reports/file.txt` **OR** `abc download --name test-container --blob may_25 --file reports/file.txt`
 
## Running the utility with node
to run the utility directly replace `abs` in above commands with node index.js  
example: `node index.js create-container -n test-container` and so on

## Extras
1. The CLI has a help options for the commands which can be invoked using `-h` or `--help`
2. To run CLI in debug mode use `-d` or `--debug true` along with CLI command 

