/**
 * Default argument map containing default values for command-line options.
 * @type {{ configFile: string, [key: string]: string }}
 */
const argMap = { configFile: 'config.yaml' };

let processArgs = [...process.argv]  // shallow copy

const args = processArgs.splice(2);

args.forEach((val) => {
    const arg = val.split('=');
    const [key, value] = arg;
    argMap[key] = value;
});

module.exports = argMap;
