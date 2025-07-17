const yaml = require( 'js-yaml');
const fs = require('fs');
const argv = require('./flagParse.js');

/**
 * Loads the YAML configuration file specified in `argv.configFile`.
 * @type {{
 *  debug: boolean,
 *  blobConfigs: {
 *     url: string,
 *     account: string
 *     key: string
 *     sasValidityDuration: number,
 *     maxRetries: number,
 *     retryInterval: number,
 *     skipTLSVerification: boolean
 *  },
 *  fileList: string[]
 * }}
 * @throws {yaml.YAMLException} Throws if there is an error parsing the YAML file.
 */
let config = yaml.load(fs.readFileSync(argv.configFile, 'utf8'));

module.exports = config;
