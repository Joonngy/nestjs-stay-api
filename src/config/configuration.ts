import { program } from 'commander'
import { load } from 'js-yaml'
import { readFileSync } from 'fs'
import { Config } from './types'

const configuration = (): Config => {
    program.option('-c, --config [config.yml] Configuration yml file path').parse(process.argv)
    program.parse()

    if (program.args.length !== 1) {
        console.log('Usage: node index.js --config <config.yml> <mode>')
        console.log('mode: stay-server')
        process.exit(1)
    }

    const OPTS = program.opts()
    const YAML_CONFIG_FILENAME = typeof OPTS.config === 'string' ? OPTS.config : './config.yml'

    const rawConfig = load(readFileSync(YAML_CONFIG_FILENAME, 'utf8')) as any

    const config = Object.keys(rawConfig)
        .filter(k => k.match(/^x-/) == null)
        .reduce((acc, k) => {
            acc[k] = rawConfig[k]
            return acc
        }, {}) as Config

    return config
}

export { configuration }
