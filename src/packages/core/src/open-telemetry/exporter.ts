import {
	SpanExporter,
	ReadableSpan,
	SimpleSpanProcessor,
	SpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { context } from '@opentelemetry/api';
import {
	ExportResult,
	ExportResultCode,
	hrTimeToNanoseconds,
	suppressTracing,
} from '@opentelemetry/core';

import { BackendProvider } from '../types';

export class JsonSpanExporter implements SpanExporter {
	/**
	 * Serializes exports so only one `createTraces` runs at a time (avoids overlapping work on the
	 * single pooled connection) and every OTEL `resultCallback` is invoked
	 */
	private exportChain: Promise<void> = Promise.resolve();

	constructor(private dataProvider: BackendProvider<unknown>) {}
	/**
	 * Export spans.
	 * @param spans
	 * @param resultCallback
	 */
	export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void) {
		this.exportChain = this.exportChain.then(async () => {
			try {
				await this.persistSpans(spans);
				resultCallback({ code: ExportResultCode.SUCCESS });
			} catch (error) {
				resultCallback({
					code: ExportResultCode.FAILED,
					error: error instanceof Error ? error : new Error(String(error)),
				});
			}
		});
	}
	/**
	 * Shutdown the exporter.
	 */
	shutdown(): Promise<void> {
		return this.exportChain;
	}
	/**
	 * Exports any pending spans in exporter
	 */
	forceFlush() {
		return Promise.resolve();
	}
	/**
	 * converts span info into more readable format
	 * @param span
	 */
	private exportInfo(span: ReadableSpan) {
		return {
			traceId: span.spanContext().traceId,
			parentId: span.parentSpanContext?.spanId,
			name: span.name,
			spanId: span.spanContext().spanId,
			timestamp: hrTimeToNanoseconds(span.startTime),
			duration: hrTimeToNanoseconds(span.duration),
			attributes: span.attributes,
		};
	}

	/**
	 * Persists spans to the Trace entity (skipped when empty, e.g. shutdown).
	 */
	private async persistSpans(spans: ReadableSpan[]): Promise<void> {
		if (!this.dataProvider.createTraces) {
			throw new Error('createTraces method is not implemented in the dataProvider');
		}
		if (spans.length === 0) return;

		await context.with(suppressTracing(context.active()), async () =>
			this.dataProvider.createTraces!(spans.map((span) => this.exportInfo(span)))
		);
	}
}

export const JsonSpanProcessor = (dataProvider: BackendProvider<unknown>): SpanProcessor =>
	new SimpleSpanProcessor(new JsonSpanExporter(dataProvider));
