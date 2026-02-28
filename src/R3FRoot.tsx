import { R3FApp } from './r3f/R3FApp';

/**
 * R3F engine entry point — default engine.
 * Game systems will be added here as they are ported.
 */
export default function R3FRoot() {
  return <R3FApp>{/* Game systems will be mounted here as tasks complete */}</R3FApp>;
}
