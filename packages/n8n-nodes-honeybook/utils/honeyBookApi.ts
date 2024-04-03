import type { IExecuteFunctions, IHookFunctions, IHttpRequestMethods } from 'n8n-workflow';
import {IDataObject} from "n8n-workflow";

const BASE_API_PATH = '/api/v2';
const BASE_API_URL = process.env.HONEYBOOK_API ?? 'http://localhost:8000';

export async function honeyBookApiRequest(
	this: IHookFunctions | IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	body: any = {},
): Promise<IDataObject> {
	const response = await this.helpers.httpRequestWithAuthentication.call(this, 'honeyBookApi', {
		baseURL: BASE_API_URL,
		url: BASE_API_PATH + path,
		method,
		body,
	});

	return response;
}
