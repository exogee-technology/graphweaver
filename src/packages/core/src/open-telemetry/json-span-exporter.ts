import { SpanExporter, ReadableSpan, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import {
	ExportResult,
	ExportResultCode,
	hrTimeToMilliseconds,
	hrTimeToTimeStamp,
} from '@opentelemetry/core';
import { BackendProvider } from '..';

export class JsonSpanExporter implements SpanExporter {
	constructor(private dataProvider: BackendProvider<unknown>) {}
	/**
	 * Export spans.
	 * @param spans
	 * @param resultCallback
	 */
	async export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void) {
		return this.saveSpans(spans, resultCallback);
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
			id: span.spanContext().spanId,
			// kind: span.kind,
			timestamp: new Date(hrTimeToTimeStamp(span.startTime)),
			duration: hrTimeToMilliseconds(span.duration),
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
	private async saveSpans(spans: ReadableSpan[], done?: (result: ExportResult) => void) {
		await this.dataProvider.createMany(spans.map((span) => this.exportInfo(span)));

		if (done) {
			return done({ code: ExportResultCode.SUCCESS });
		}
	}
}

export const JsonSpanProcessor = (dataProvider: BackendProvider<unknown>) =>
	new SimpleSpanProcessor(new JsonSpanExporter(dataProvider));
