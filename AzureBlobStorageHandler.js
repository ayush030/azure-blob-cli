const azure = require( 'azure-storage');
const AzureBlobStorageConfiguration = require("./models/AzureBlobStorageConfiguration.js");

class AzureBlobStorageHandler {
    /**
     *[PRIVATE MEMBER]
     * @description stores the sas token, used for authenticating with azure storage
     */
    #sasToken;

    /**
     *[PRIVATE MEMBER]
     * @description object of models/AzureBlobStorageConfiguration (data)class. Used to save azure blob storage configuration.
     */
    #config

    /**
     * @description AzureBlobStorageHandler constructor. Initializes config for azure storage and reads file list from config
     */
    constructor(azureConfig, fileList) {
        this.#config = new AzureBlobStorageConfiguration(azureConfig.url, azureConfig.account, azureConfig.accountKey, azureConfig.options);
        this.fileList = fileList;

        this.#init();
    }

    /**
     * [PRIVATE METHOD]
     * @descriptionCreates a SAS token and blob storage container if it already not exists
     **/
     #init() {
        if (this.#config.skipTLSVerification) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
        }
    }

    /**
     * [PRIVATE METHOD]
     * @description gives shared access policy with full privileges
     **/
    #getDefaultSharedAccessPolicy() {
        const startDate = new Date(Date.now());
        const expiryDate = new Date(startDate.getTime() + this.#config.sasValidityDuration * 60000);

        return {
            AccessPolicy: {
                Permissions: azure.BlobUtilities.SharedAccessPermissions.READ +
                    azure.BlobUtilities.SharedAccessPermissions.WRITE +
                    azure.BlobUtilities.SharedAccessPermissions.DELETE +
                    azure.BlobUtilities.SharedAccessPermissions.LIST,
                Start: startDate,   // start date for the SAS token
                Expiry: expiryDate, // expiry date for the SAS token
            }
        }
    }

    /**
     * [PRIVATE METHOD]
     * @description generates a new Shared Access Signature token used for authenticating blob service operation calls
     **/
    #generateSAS(containerName) {
        let blobService = azure.createBlobService(this.#config.account, this.#config.accountKey, this.#config.url)

        // generate Shared Access Signature token for container
        this.#sasToken = blobService.generateSharedAccessSignature(containerName, null, this.#getDefaultSharedAccessPolicy());
    }

    /**
     * [PRIVATE METHOD]
     * @description Pauses the execution for specified time
     * @typedef{(duration: number) => Promise<void>}
     * @param duration - pause duration in seconds
     **/
    #sleep(duration) {
        return new Promise(resolve => setTimeout(resolve, duration*1000));
    }

    /**
     * [PRIVATE METHOD]
     * @description gives file name from provided file path
     * @typedef{(filePath: string) => string}
     * @param filePath - full path of file(along with directory)
     **/
    #getFileName(filePath) {
        return filePath.split("/").pop()
    }
    /**
     * @description Creates a blob storage container if it already not exists
     * @typedef{(containerName: string, debug: boolean) => Promise<Object>}
     * @param containerName - name of container at the azure blob storage
     * @param debug - display debug response
     **/
    async createContainerInBlobStorage(containerName, debug) {
        let accountSasToken = azure.generateAccountSharedAccessSignature(this.#config.account, this.#config.accountKey, {
            Permissions: azure.BlobUtilities.SharedAccessPermissions.READ+
                azure.BlobUtilities.SharedAccessPermissions.WRITE+
                azure.BlobUtilities.SharedAccessPermissions.LIST+
                azure.BlobUtilities.SharedAccessPermissions.DELETE,
            Start: new Date(),
            Expiry: new Date(Date.now() + this.#config.sasValidityDuration * 60000)
        })

        let blobService = azure.createBlobService(this.#config.account, this.#config.accountKey, this.#config.url)

        // create the container if it not exists
        return new Promise((resolve, reject) => {
            blobService.createContainerIfNotExists(
                containerName,
                {publicAccessLevel: 'container'},
                (err, result) => {
                    if (err) {
                        console.error("Error in creating container ", {
                            container: containerName,
                            err
                        });

                        reject(err);
                    } else if (result.created) {
                        console.info("container created successfully", {container: containerName});
                    } else {
                        console.info("container already exists", {container: containerName});
                    }

                    if (debug) {
                        const successRecord = {
                            containerName: containerName,
                            result
                        }

                        console.debug("Response captured", successRecord)
                    }

                    resolve(result);
                });
        })
    }

    /**
     * @description deletes a blob storage container if it already exists
     * @typedef{(containerName: string, debug: boolean) => Promise<Object>}
     * @param containerName - name of container at the azure blob storage
     * @param debug - display debug response
     **/
    async deleteContainerInBlobStorage(containerName, debug) {
        let blobService = azure.createBlobService(this.#config.account, this.#config.accountKey, this.#config.url)

        return new Promise((resolve, reject) => {
            blobService.deleteContainer(
                containerName,
                (err, resp) => {
                    if (err) {
                        console.error(`Error while deleting container ${containerName}`, err);
                        reject(err);
                    } else {
                        console.info(`Successfully deleted container ${containerName}`);

                        if (debug) {
                            const successRecord = {
                                containerName: containerName,
                                resp
                            }
                            console.debug("Response captured", successRecord)
                        }

                        resolve(resp);
                    }
                });
        })
    }

    /**
     * [PRIVATE METHOD]
     * @description uploads file to azure blob storage by using the SAS token
     * @typedef{(containerName: string, blob: string, filePath: string, debug: boolean) => Promise<Object>}
     * @param containerName - name of container at the azure blob storage
     * @param blob - name of blob at the azure blob storage
     * @param filePath - full path of file that will be uploaded to blob storage
     * @param debug - display debug response
     **/
    async #uploadFileToAzureBlobStorage(containerName, blob, filePath, debug) {
        let blobService = azure.createBlobServiceWithSas(this.#config.url, this.#sasToken);

        return new Promise((resolve, reject) => {
            blobService.createBlockBlobFromLocalFile(
                containerName,
                blob + "/" + this.#getFileName(filePath),
                filePath,
                (error, resp) => {
                    if (error) {
                        console.error("Error while uploading file", {
                            file: filePath,
                            errorMessage: error.message,
                        });

                        reject(error);
                    } else {
                        console.info("Successfully uploaded file ", {
                            fileName: filePath
                        });

                        if(debug) {
                            const successRecord = {
                                blobName: blob,
                                resp
                            }
                            console.debug("Response captured", {successRecord})
                        }

                        resolve(resp);
                    }
                });
        })
    }

    /**
     * @description Uploads a file to the Azure blob storage with the provided blob name.
     * @typedef{(containerName: string, filePath: string, blobName: string) => Promise<void>}
     * @param containerName - name of container
     * @param filePath - full valid path of file to be uploaded
     * @param blobName - blob name of the file getting uploaded. To maintain FS type hierarchy, add sub folder name before the file name followed by a '/'.
     * example: dir/file.txt as blob name will upload file.txt inside 'dir' folder in Azure blob storage.
     * @param debug - display debug response
     **/
    async uploadFileToBlobStorage(containerName, filePath, blobName, debug) {
        let retries = 0

        do {
            try {
                this.#generateSAS(containerName);

                let successRecord = await this.#uploadFileToAzureBlobStorage(containerName, blobName, filePath, debug);
                return Promise.resolve(successRecord)
            } catch (error) {
                if (debug) {
                    console.warn("upload file failed", {
                        file: filePath,
                        retryCount: retries,
                        error
                    });
                }
            }

            retries += 1;
            await this.#sleep(this.#config.retryInterval);
        } while (retries < this.#config.maxRetries + 1);

        console.error('Unable to upload file after retry ',{
            file: filePath,
            retryCount: this.#config.maxRetries
        })

        return Promise.reject(`Unable to upload file ${filePath}`);
    }

    /**
     * @description downloads file from blob storage
     * @typedef{(containerName: string, blob: string, file: string, path: string, debug: boolean) => Promise<Object>}
     * @param containerName - name of container at the azure blob storage
     * @param blob - name of blob at the azure blob storage
     * @param file - file at the azure blob storage
     * @param path - full path of file(along with directory) that will be downloaded from blob storage
     * @param debug - display debug response
     **/
    async downloadReportFromBlobStorage(containerName, blob, file, path, debug) {
        if (!this.#sasToken) {
            this.#generateSAS(containerName);
        }

        let blobService = azure.createBlobServiceWithSas(this.#config.url, this.#sasToken);

        blobService.getBlobToLocalFile(containerName, `${blob}/${file}`, `${path}/${file}`,
            (err, resp) => {
                if (err) {
                    console.error("Error while downloading file " + file , err);
                    return Promise.reject(err);
                } else {
                    console.info("Successfully downloaded file " + file);

                    if (debug) {
                        const successRecord = {
                            containerName: file,
                            resp
                        }
                        console.debug("Response captured successfully", successRecord)
                    }
                }
            })
    }

    /**
     * @description downloads files from blob storage in file list provided in configuration file
     * @typedef{(containerName: string, blob: string, path: string, debug: boolean) => Promise<Object>}
     * @param containerName - name of container at the azure blob storage
     * @param blob - name of blob at the azure blob storage
     * @param path - full path of file(along with directory) that will be downloaded from blob storage
     * @param debug - display debug response
     **/
    async downloadAllReportsFromBlobStorage(containerName, blob, path, debug) {
        if (this.fileList === undefined) {
            return Promise.reject(new Error("file list not available"));
        }

        for (const file of this.fileList) {
            try {
                await this.downloadReportFromBlobStorage(containerName, blob, file, path, debug);
            } catch (e) {
                if (debug) {
                    const failureRecord = {
                        containerName: containerName,
                        file: file,
                        e
                    }

                    console.error("Error while downloading file " + file , e);
                } else {
                    console.error("Error while downloading file " + file);
                }

                // continue to download another report
            }
        }

        return Promise.resolve("reports download operation completed");
    }

    /**
     * @description lists entities of blob storage
     * @typedef{(containerName: string, prefix: string, debug: boolean) => Promise<Object>}
     * @param containerName - name of container at the azure blob storage
     * @param prefix - name of prefix/folder at the azure blob storage
     * @param debug - display debug response
     **/
    async listAzureEntities(containerName, prefix, debug) {
        if (!containerName) {
            return this.#listContainers(debug);
        }

        if (!prefix) {
            return this.#listBlobs(containerName, debug);
        }

        return this.#listFilesWithPrefix(containerName, prefix, debug);
    }

    /**
     * [PRIVATE METHOD]
     * @description lists containers present in the blob storage
     * @typedef{(debug: boolean) => Promise<Object>}
     * @param debug - display debug response
     **/
    async #listContainers(debug) {
        let blobService = azure.createBlobService(this.#config.account, this.#config.accountKey, this.#config.url)

        return new Promise((resolve, reject) => {
            blobService.listContainersSegmented(null, (err, result) => {
                if (err) {
                    console.error("Error while listing containers", err);
                    reject(err);
                } else {
                    let data = []
                    if (debug) {
                        for (const container of result.entries) {
                            data.push({
                                name: container.name,
                                lastModified: container.lastModified,
                                etag: container.etag,
                                leaseStatus: container.lease,
                                legalHold: container.hasLegalHold,
                                publicAccessLevel: container.publicAccessLevel,
                            });
                        }
                        console.info("Successfully listed containers");
                    } else {
                        for (const container of result.entries) {
                            data.push({
                                name: container.name,
                                lastModified: container.lastModified
                            });
                        }
                    }

                    console.table(data);
                    resolve(result);
                }
            })
        });
    }

    /**
     * [PRIVATE METHOD]
     * @description lists containers present in the blob storage
     * @typedef{(containerName: string, debug: boolean) => Promise<Object>}
     * @param containerName - name of container at the azure blob storage
     * @param debug - display debug response
     **/
    async #listBlobs(containerName, debug) {
        let blobService = azure.createBlobService(this.#config.account, this.#config.accountKey, this.#config.url)

        return new Promise((resolve, reject) => {
            blobService.listBlobsSegmented(containerName, null, (err, result) => {
                if (err) {
                    console.error(`Error while listing blobs in container ${containerName}`, err);
                    reject(err);
                } else {
                    let folders = new Set()

                    for (const blob of result.entries) {
                        let folder = blob.name.split("/")[0]

                        if (folder && !folders.has(folder)) {
                            folders.add(folder)
                        }
                    }

                    if (debug) {
                        console.info(`Successfully listed blobs in container ${containerName}`);
                    }

                    console.table(folders.keys());
                    resolve(result);
                }
            })
        })
    }

    /**
     * [PRIVATE METHOD]
     * @description lists containers present in the blob storage
     * @typedef{(containerName: string, debug: boolean) => Promise<Object>}
     * @param containerName - name of container at the azure blob storage
     * @param prefix - prefix associated with blob azure blob storage
     * @param debug - display debug response
     **/
    async #listFilesWithPrefix(containerName, prefix, debug) {
        let blobService = azure.createBlobService(this.#config.account, this.#config.accountKey, this.#config.url)

        return new Promise((resolve, reject) => {
            blobService.listBlobsSegmentedWithPrefix(containerName, prefix, null, (err, result) => {
                if (err) {
                    console.error(`Error while listing blobs in container ${containerName} with prefix ${prefix}`, err);
                    reject(err);
                } else {
                    let data = []

                    for (const blob of result.entries) {
                        let blobInfo = blob.name.split("/")

                        if (blobInfo[0] !== prefix) {
                            continue
                        }

                        if (debug) {
                            data.push({
                                name: blobInfo[1],
                                creation: blob.creationTime,
                                lastModified: blob.lastModified,
                                etag: blob.etag,
                                contentType: blob.contentSettings.contentType,
                                contentLength: blob.contentLength,
                                leaseStatus: blob.lease,
                                type: blob.blobType
                            });

                        } else {
                            data.push({
                                name: blobInfo[1],
                                creation: blob.creationTime,
                                lastModified: blob.lastModified,
                                contentType: blob.contentSettings.contentType,
                                contentLength: blob.contentLength,
                            })
                        }
                    }

                    console.info(`Successfully listed blobs in container ${containerName} with prefix ${prefix}`);
                    console.table(data);
                    resolve(result);
                }
            })
        })
    }
}

module.exports = AzureBlobStorageHandler;
