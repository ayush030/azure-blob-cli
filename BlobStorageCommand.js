const AzureBlobStorageHandler = require("./AzureBlobStorageHandler.js");

function addBlobStorageCommandOptions(program, azureConfig, fileList, debug=false) {
    let azureHandler = new AzureBlobStorageHandler(azureConfig, fileList)

    // create a blob storage container
    program
        .command('create-container')
        .description('Creates container in blob storage')
        .option('-n, --name <name>', 'The name of the container')
        .option('-d, --debug <debug>', 'Enable debug response')
        .action(async (options, _) => {
            await azureHandler.createContainerInBlobStorage(options.name, options.debug); // some hocus-pocus
        })

    // delete a blob storage container
    program
        .command('delete-container')
        .description('Deletes container from the blob storage')
        .option('-n, --name <name>', 'The name of the container')
        .option('-d, --debug <debug>', 'Enable debug response')
        .action(async (options, _) => {
            await azureHandler.deleteContainerInBlobStorage(options.name, options.debug);
        })

    // download file from blob storage
    program
        .command('download')
        .description('Downloads files from the blob storage. Drop -f to download all files mentioned in config file list')
        .option('-n, --name <name>', 'name of the container')
        .option('-b, --blob <blob>', 'name of blob')
        .option('-f, --file <file>', 'file to download')
        .option('-o, --output <output>', 'path to store downloaded report(s)')
        .option('-d, --debug <debug>', 'Enable debug response')
        .action(async(options, _) => {
            if (!options.output) {
                // set download path to present directory
                options.output = ".";
            }

            if (!options.file) {
                await azureHandler.downloadAllReportsFromBlobStorage(options.name, options.blob, options.output, options.debug);
            } else {
                console.log(`Downloaded ${options.name} to ${options.blob}`);
                await azureHandler.downloadReportFromBlobStorage(options.name, options.blob, options.file, options.output, options.debug);
            }
        })

    // upload file to blob storage
    program
        .command('upload')
        .description('Uploads file to the blob storage at the provided path within the container')
        .option('-n, --name <name>', 'The name of the container')
        .option('-f, --file <file>', 'path of file to upload')
        .option('-b, --blob <blob>', 'name of blob to upload to')
        .option('-d, --debug <debug>', 'Enable debug response')
        .action(async (options, _) => {
            await azureHandler.uploadFileToBlobStorage(options.name, options.file, options.blob, options.debug)
        })

    // list storage entities
    program
        .command('list')
        .description('Lists all blobs in the container')
        .option('-n, --name <name>', 'The name of the container')
        .option('-p, --prefix <prefix>', 'The prefix/folder of the blob')
        .option('-d, --debug <debug>', 'Enable debug response')
        .action(async (options, _) => {
            await azureHandler.listAzureEntities(options.name, options.prefix, options.debug)
        })
}

module.exports = {
    addBlobStorageCommandOptions
}
