/**
 * @description CLI utility for working with azure blob storage
 * @version 1.0.0
 * @author Ayush Tripathi
 **/

const config = require("./utilities/configreader.js");
const {Command} = require('commander');
const {addBlobStorageCommandOptions} =require("./BlobStorageCommand.js");

async function main() {
    let azureConfig = {
        url: config.blobConfigs.url,
        account : config.blobConfigs.account,
        accountKey: config.blobConfigs.key,
        options : {
            maxRetries: config.blobConfigs.maxRetries,
            sasValidityDuration: config.blobConfigs.sasValidityDuration,
            retryInterval: config.blobConfigs.retryInterval,
            skipTLSVerification: config.blobConfigs.skipTLSVerification,
        }
    };

    const  program = new Command();
    addBlobStorageCommandOptions(program, azureConfig, config.fileList, config.debug);

    program.parse(process.argv);

    if (config.debug) {
        console.info("making an exit!");
    }
}

(async () => {
    await main();
})();
