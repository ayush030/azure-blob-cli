class AzureBlobStorageConfiguration {
    #accountKey
    #account
    #url

    sasValidityDuration = 15 //minutes
    retryInterval = 3 // seconds
    skipTLSVerification = false // enabled TLS verification by default
    maxRetries = 3

     /**
      * @description constructor that reads and save azure storage configuration from yaml
      **/
    constructor(url, account, accountKey, options=null) {
        this.#url = url;
        this.#account = account;
        this.#accountKey = accountKey;

        if (options !== null) {
            if (options.maxRetries !== undefined) {
                this.maxRetries = options.maxRetries;
            }

            if (options.sasValidityDuration !== undefined) {
                this.sasValidityDuration = options.sasValidityDuration;
            }

            if (options.retryInterval !== undefined) {
                this.retryInterval = options.retryInterval;
            }

            if (options.skipTLSVerification !== undefined) {
                this.skipTLSVerification = options.skipTLSVerification;
            }
        }

        this.#validate()
    }

    /**
     * [PRIVATE METHOD]
     * @description validates essential configuration and throws an error in case of any discrepancy
     **/
    #validate() {
        if (this.#url === undefined || this.#url === "") {
            throw new Error("Need an azure storage URL for communication")
        }

        if (this.#account === undefined || this.#account === "") {
            throw new Error("Need an azure account to work with")
        }

        if (this.#accountKey === undefined || this.#accountKey === "") {
            throw new Error("Need an azure account key for authentication")
        }
    }

     /**
      * @description Getter method to fetch account
      **/
    get account() {
        return this.#account;
    }

     /**
      * @description Getter method to fetch account key
      **/
    get accountKey() {
        return this.#accountKey;
    }

     /**
      * @description Getter method to fetch storage URL
      **/
    get url() {
        return this.#url;
    }
}

module.exports = AzureBlobStorageConfiguration
