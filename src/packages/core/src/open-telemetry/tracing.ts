import process from 'process';
import { isAsyncFunction } from 'util/types';
import { Span, SpanOptions, SpanStatusCode, trace as traceApi, context } from '@opentelemetry/api';
import * as opentelemetry from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { isTracingSuppressed, suppressTracing, unsuppressTracing } from '@opentelemetry/core';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { logger } from '@exogee/logger';

import type { Instrumentation } from '@opentelemetry/instrumentation';

import { JsonSpanProcessor } from './exporter';
import { BackendProvider, TraceOptions } from '../types';
import { graphweaverMetadata } from '../metadata';
import { Trace, addTraceEntityToSchema } from './entity';

export interface TraceData {
	id: string;
	traceId: string;
	parentId: string;
	name: string;
	timestamp: bigint;
	duration: bigint;
	attributes: Record<string, unknown>;
}

export const isTraceable = () =>
	!!process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
	!!graphweaverMetadata.getEntityByName('Trace')?.provider;

export const setEnableTracingForRequest = <T>(fn: () => Promise<T>) => {
	return context.with(unsuppressTracing(context.active()), fn);
};

export const setDisableTracingForRequest = <T>(fn: () => Promise<T>) => {
	return context.with(suppressTracing(context.active()), fn);
};

// Decorator to add tracing to any instance method
// Usage:
// @Trace()
// async myMethod() {
//   // Do something
// }
export function TraceMethod() {
	return (_target: any, _fieldName: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;
		const isAsync = isAsyncFunction(originalMethod);

		if (isAsync) {
			descriptor.value = async function (...args: any[]) {
				return trace(originalMethod.bind(this)).apply(this, args);
			};
		} else {
			descriptor.value = function (...args: any[]) {
				return traceSync(originalMethod.bind(this)).apply(this, args);
			};
		}
	};
}

// A generic type to wrap the function args in an array and add Span
type WithSpan<Args extends any[]> = [...Args, TraceOptions | undefined];

// Wrap a function with tracing
export const trace =
	<Args extends any[], T>(
		fn: (...params: WithSpan<Args>) => Promise<T>,
		spanOptions: SpanOptions = {},
		spanName: string = fn.name
	) =>
	async (...functionArgs: Args) => {
		const isContextTracingSuppressed = isTracingSuppressed(context.active());

		// Check if tracing is enabled
		if (!isTraceable() || isContextTracingSuppressed) {
			return fn(...functionArgs, undefined);
		}

		const tracer = traceApi.getTracer('graphweaver');

		return tracer.startActiveSpan(spanName, spanOptions, async (span: Span) => {
			try {
				const traceArg: TraceOptions = { span, tracer };
				const args = [...functionArgs, traceArg] as WithSpan<Args>;
				const result = await fn(...args);
				span.setStatus({
					code: SpanStatusCode.OK,
				});
				return result;
			} catch (error: any) {
				logger.error(error);
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
		const isContextTracingSuppressed = isTracingSuppressed(context.active());

		// Check if tracing is enabled
		if (!isTraceable() || isContextTracingSuppressed) {
			return fn(...functionArgs, undefined);
		}

		const tracer = traceApi.getTracer('graphweaver');

		return tracer.startActiveSpan(spanName, spanOptions, (span: Span) => {
			try {
				const traceArg: TraceOptions = { span, tracer };
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
	const exporterUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

	if (exporterUrl || traceProvider) {
		addTraceEntityToSchema();

		const traceExporter = exporterUrl
			? new OTLPTraceExporter({
					url: `${exporterUrl}/v1/traces`,
				})
			: undefined;

		if (traceProvider) {
			graphweaverMetadata.collectProviderInformationForEntity({
				target: Trace,
				provider: traceProvider,
			});
		}

		const sdk = new opentelemetry.NodeSDK({
			spanProcessors: traceProvider ? [JsonSpanProcessor(traceProvider)] : [],
			traceExporter,
			instrumentations,
			resource: resourceFromAttributes({
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
