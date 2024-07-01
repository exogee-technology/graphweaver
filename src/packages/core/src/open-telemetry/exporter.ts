import {
	SpanExporter,
	ReadableSpan,
	SimpleSpanProcessor,
	SpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import {
	ExportResult,
	ExportResultCode,
	hrTimeToMicroseconds,
	hrTimeToNanoseconds,
} from '@opentelemetry/core';

import { BackendProvider } from '../types';

export class JsonSpanExporter implements SpanExporter {
	private queue: ReadableSpan[];
	private locked: boolean = false;

	constructor(private dataProvider: BackendProvider<unknown>) {
		this.queue = [];
	}
	/**
	 * Export spans.
	 * @param spans
	 * @param resultCallback
	 */
	export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void) {
		if (this.locked) {
			this.queue.push(...spans);
			return;
		} else {
			this.locked = true;
			return this.saveSpans(spans, resultCallback);
		}
	}
	/**
	 * Shutdown the exporter.
	 */
	shutdown() {
		this.saveSpans([]);
		return this.forceFlush();
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
		// var _a;
		return {
			// resource: {
			// 	attributes: span.resource.attributes,
			// },
			traceId: span.spanContext().traceId,
			parentId: span.parentSpanId,
			// traceState:
			// 	(_a = span.spanContext().traceState) === null || _a === void 0 ? void 0 : _a.serialize(),
			name: span.name,
			spanId: span.spanContext().spanId,
			// kind: span.kind,
			timestamp: hrTimeToMicroseconds(span.startTime),
			duration: hrTimeToNanoseconds(span.duration),
			attributes: span.attributes,
			// status: span.status,
			// events: span.events,
			// links: span.links,
		};
	}

	/**
	 * Showing spans in console
	 * @param spans
	 * @param done
	 */
	private async saveSpans(
		spans: ReadableSpan[],
		done?: (result: ExportResult) => void
	): Promise<void> {
		await (this.dataProvider as any)._createMany(spans.map((span) => this.exportInfo(span)));

		if (this.queue.length > 0) {
			const toSave = this.queue;
			this.queue = [];
			return this.saveSpans(toSave, done);
		}

		this.locked = false;

		if (done) {
			return done({ code: ExportResultCode.SUCCESS });
		}
	}
}

export const JsonSpanProcessor = (dataProvider: BackendProvider<unknown>): SpanProcessor =>
	new SimpleSpanProcessor(new JsonSpanExporter(dataProvider));
