import { initRegistry } from '../plugins/loader';
import path from 'path';

// Initialize the registry with core components for tests
// Using process.cwd() as the base
await initRegistry(process.cwd());
