import { trace, type PerformanceTrace } from 'firebase/performance';
import { perf } from './firebase';

/**
 * Helper to start a performance trace
 * Safely handles environments where performance monitoring might not be supported
 */
export const startTrace = (name: string): PerformanceTrace | null => {
  try {
    const t = trace(perf, name);
    t.start();
    return t;
  } catch (error) {
    console.debug(`[Performance] Failed to start trace "${name}":`, error);
    return null;
  }
};

/**
 * Helper to end a performance trace
 */
export const endTrace = (t: PerformanceTrace | null) => {
  try {
    if (t) {
      t.stop();
    }
  } catch (error) {
    console.debug('[Performance] Failed to stop trace:', error);
  }
};

/**
 * Helper to record a custom metric on a trace
 */
export const recordMetric = (t: PerformanceTrace | null, metricName: string, value: number) => {
  try {
    if (t) {
      t.putMetric(metricName, value);
    }
  } catch (error) {
    console.debug(`[Performance] Failed to record metric "${metricName}":`, error);
  }
};

/**
 * Helper to put a custom attribute on a trace
 */
export const putAttribute = (t: PerformanceTrace | null, attr: string, value: string) => {
  try {
    if (t) {
      t.putAttribute(attr, value);
    }
  } catch (error) {
    console.debug(`[Performance] Failed to put attribute "${attr}":`, error);
  }
};
