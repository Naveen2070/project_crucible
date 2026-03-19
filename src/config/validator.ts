import Ajv from 'ajv';
import schema from './schema.json';
import { CrucibleConfig } from './reader';

const ajv = new Ajv({ allErrors: true, useDefaults: true });
const validate = ajv.compile(schema);

export function validateConfig(config: any): CrucibleConfig {
  const valid = validate(config);
  if (!valid) {
    const errors = validate.errors
      ?.map((err) => `  - ${err.instancePath} ${err.message}`)
      .join('\n');
    throw new Error(`Invalid crucible.config.json:\n${errors}`);
  }
  return config as unknown as CrucibleConfig;
}
