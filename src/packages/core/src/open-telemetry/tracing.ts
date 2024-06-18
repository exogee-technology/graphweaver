import process from 'process';
import { isAsyncFunction } from 'util/types';
import { Span, SpanOptions, SpanStatusCode, Tracer, trace as traceApi } from '@opentelemetry/api';
import * as opentelemetry from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { logger } from '@exogee/logger';

import type { Instrumentation } from '@opentelemetry/instrumentation';

import { JsonSpanProcessor } from './json-span-exporter';
import { BackendProvider } from '..';

// Check is env variable is set to enable tracing
export const isTraceable = !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
export const tracer = isTraceable ? traceApi.getTracer('graphweaver') : undefined;

// Decorator to add tracing to any instance method
// Usage:
// @Trace()
// async myMethod() {
//   // Do something
// }
export function TraceMethod() {
	return (_target: any, _fieldName: string, descriptor: PropertyDescriptor) => {
		if (isTraceable) {
			const originalMethod = descriptor.value;
			const isAsync = isAsyncFunction(originalMethod);

			descriptor.value = function (...args: any[]) {
				return isAsync
					? trace(originalMethod.bind(this)).apply(this, args)
					: traceSync(originalMethod.bind(this)).apply(this, args);
			};
		}
	};
}

export interface Trace {
	span: Span;
	tracer: Tracer;
}

// A generic type to wrap the function args in an array and add Span
type WithSpan<Args extends any[]> = [...Args, Trace | undefined];

// Wrap a function with tracing
export const trace =
	<Args extends any[], T>(
		fn: (...params: WithSpan<Args>) => Promise<T>,
		spanOptions: SpanOptions = {},
		spanName: string = fn.name
	) =>
	async (...functionArgs: Args) => {
		// Check if tracing is enabled
		if (!isTraceable || !tracer) {
			return fn(...functionArgs, undefined);
		}

		return tracer.startActiveSpan(spanName, spanOptions, async (span: Span) => {
			try {
				const traceArg: Trace = { span, tracer };
				const args = [...functionArgs, traceArg] as WithSpan<Args>;
				const result = await fn(...args);
				span.setStatus({
					code: SpanStatusCode.OK,
				});
				return result;
			} catch (error: any) {
				const errorMessage = String(error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
				span.recordException(error);
				throw error;
			} finally {
				span.end();
			}
		});
	};

// Wrap a synchronous function with tracing
export const traceSync =
	<Args extends any[], T>(
		fn: (...params: WithSpan<Args>) => T,
		spanOptions: SpanOptions = {},
		spanName: string = fn.name
	) =>
	(...functionArgs: Args) => {
		// Check if tracing is enabled
		if (!isTraceable || !tracer) {
			return fn(...functionArgs, undefined);
		}

		return tracer.startActiveSpan(spanName, spanOptions, (span: Span) => {
			try {
				const traceArg: Trace = { span, tracer };
				const args = [...functionArgs, traceArg] as WithSpan<Args>;
				const result = fn(...args);
				span.setStatus({
					code: SpanStatusCode.OK,
				});
				return result;
			} catch (error: any) {
				const errorMessage = String(error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
				span.recordException(error);
				throw error;
			} finally {
				span.end();
			}
		});
	};

// Start tracing with OpenTelemetry if enabled
export const startTracing = ({
	instrumentations,
	traceProvider,
}: {
	instrumentations: (Instrumentation | Instrumentation[])[];
	traceProvider?: BackendProvider<unknown>;
}) => {
	if (isTraceable) {
		const traceExporter = new OTLPTraceExporter({
			url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
		});

		const sdk = new opentelemetry.NodeSDK({
			spanProcessors: traceProvider ? [JsonSpanProcessor(traceProvider)] : [],
			traceExporter,
			instrumentations,
			resource: new Resource({
				['service.name']: process.env.SERVICE_NAME ?? 'Graphweaver',
			}),
		});

		// initialize the SDK and register with the OpenTelemetry API
		// this enables the API to record telemetry
		sdk.start();

		// gracefully shut down the SDK on process exit
		process.on('SIGTERM', () => {
			sdk
				.shutdown()
				.then(() => logger.info('Tracing terminated'))
				.catch((error) => logger.error('Error terminating tracing', error))
				.finally(() => process.exit(0));
		});
	}
};
