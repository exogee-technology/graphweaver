import { getSetting, setSetting } from '@traffyk-ai/data-collector-settings';
import { fetch } from 'undici';
import { getAccessToken } from './auth';
import { logger } from '@traffyk-ai/data-collector-logger';
import api from '@forge/api';
// we use forge fetch to get the right data format back, but it seems the only difference is
// these additional headers:
// 'User-Agent': [ 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)' ],
// 'Accept-Encoding': [ 'gzip,deflate' ]
interface TenantInfoResult {
	cloudId: string;
}
interface JiraResultPage {
	startAt: number;
	maxResults: number;
	total: number;
	isLast?: boolean; // don't rely on this
	[key: string]: any;
}
interface IssueSearchResult extends JiraResultPage {
	issues: any[];
}
interface ConfluenceResultLinks {
	next?: string;
}
interface ConfluenceResultPage {
	results: any[];
	_links: ConfluenceResultLinks;
}
let cloudId: string | undefined = undefined;
const tenantUrl = await getSetting<string>('atlassian.tenantUrl');
cloudId = await getSetting<string>('atlassian.cloudId');
export const authUrl = await getSetting<string>('atlassian.authUrl');
const hasMoreResultsJira = (page: IssueSearchResult) => {
	logger.trace(`Calculation: ${page.total} - ${page.startAt} - ${page.issues.length}`);
	const hasMore = page.total - page.startAt - page.issues.length > 0;
	logger.trace(`More results? ${hasMore}`);
	return hasMore;
};
const hasMoreResultsConfluence = (page: ConfluenceResultPage) => {
	const hasMore = !!page._links.next;
	return hasMore;
};
const fetchJson = async (url: URL, options?: any) => {
	logger.trace(`Fetching ${url}`, options);
	const response: Response = await fetch(url, options);
	if (!response.ok) throw Error(`Got HTTP status code ${response.status} for request to ${url}`);
	const json = await response.json();
	return json;
};
export const getCloudId = async () => {
	logger.trace('Enter: getCloudId');
	if (cloudId) return cloudId;
	if (!cloudId) {
		logger.trace(`No cloudId found in settings - requesting cloudId from ${tenantUrl}`);
		const url = new URL('/_edge/tenant_info', tenantUrl);
		const json = await fetchJson(url);
		logger.trace(json);
		const result = json as TenantInfoResult;
		cloudId = result.cloudId;
		await setSetting('atlassian.cloudId', cloudId);
	}
	return cloudId;
};
const getJiraApiUrl = async () => {
	const id = await getCloudId();
	const apiUrl = new URL(`https://api.atlassian.com/ex/jira/${id}/rest/api/3/`);
	logger.trace('API URL: ', apiUrl.href);
	return apiUrl;
};
const getConfluenceApiUrl = async () => {
	const id = await getCloudId();
	const apiUrl = new URL(`https://api.atlassian.com/ex/confluence/${id}/wiki/api/v2/`);
	logger.trace('API URL: ', apiUrl.href);
	return apiUrl;
};
export const isPagedResult = (result: any) => {
	return result.maxResults || result.startAt || result.total;
};
export const jiraClient = {
	query: async (apiMethod: string, httpMethod = 'GET') => {
		logger.trace('Enter: query');
		const apiUrl = await getJiraApiUrl();
		const url = new URL(apiMethod, apiUrl);
		const token = await getAccessToken();
		if (!token) throw Error('No access token');
		const init = {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			method: httpMethod,
		};
		const response = await api.fetch(url.href, init);
		const result = await response.json();
		if (result.errorMessages) logger.error(result.errorMessages);
		logger.info(`Exit: query`);
		return result;
	},
	queryWithPagedResults: async (method: string, httpMethod = 'POST') => {
		logger.trace('Enter: queryWithPagedResults');
		const apiUrl = await getConfluenceApiUrl();
		const url = new URL(method, apiUrl);
		const token = await getAccessToken();
		if (!token) throw Error('No access token');
		let startAt = 0;
		const init = {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			method: httpMethod,
			body:
				httpMethod === 'POST'
					? JSON.stringify({
							startAt,
							fields: ['*all'],
					  })
					: undefined,
		};
		const results = [];
		let hasMore = false;
		do {
			const response = await api.fetch(url.href, init);
			const result = await response.json();
			results.push(...result.issues);
			startAt += result.issues.length;
			init.body = JSON.stringify({ startAt, fields: ['*all'] });
			logger.info(`${startAt} results (cumulative)`);
			hasMore = hasMoreResultsJira(result);
		} while (hasMore);
		logger.info(`${results.length} results`);
		logger.info(`Exit: queryWithPagedResults`);
		return results;
	},
};
export const confluenceClient = {
	query: async (method: string, httpMethod = 'GET') => {
		logger.trace('Enter: query');
		const apiUrl = await getConfluenceApiUrl();
		const url = new URL(method, apiUrl);
		const token = await getAccessToken();
		if (!token) throw Error('No access token');
		const init = {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			method: httpMethod,
		};
		const response = await api.fetch(url.href, init);
		if (!response.ok) {
			const base64 = token.split('.')[1] ?? '';
			const buff = Buffer.from(base64, 'base64');
			const text = buff.toString('utf-8');
			logger.error('token:', JSON.parse(text));
			logger.error('response', await response.json());
		}
		const result = await response.json();
		if (result.errorMessages) logger.error(result.errorMessages);
		logger.info(`Exit: query`);
		return result;
	},
	queryWithPagedResults: async (method: string, httpMethod = 'GET') => {
		logger.trace('Enter: queryWithPagedResults');
		const apiUrl = await getConfluenceApiUrl();
		let url = new URL(method, apiUrl);
		const token = await getAccessToken();
		if (!token) throw Error('No access token');
		const init = {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			method: httpMethod,
		};
		const results = [];
		let hasMore = false;
		do {
			const response = await api.fetch(url.href, init);
			if (!response.ok) {
				const base64 = token.split('.')[1] ?? '';
				const buff = Buffer.from(base64, 'base64');
				const text = buff.toString('utf-8');
				console.log(JSON.parse(text));
				console.log(await response.json());
			}
			const json = await response.json();
			if (json.errorMessages) logger.error(json.errorMessages);
			else results.push(...json.results);
			logger.info(`${results.length} results (cumulative)`);
			hasMore = hasMoreResultsConfluence(json);
			if (hasMore) url = new URL(method, json._links.next);
		} while (hasMore);
		logger.info(`${results.length} results`);
		logger.info(`Exit: queryWithPagedResults`);
		return results;
	},
};
