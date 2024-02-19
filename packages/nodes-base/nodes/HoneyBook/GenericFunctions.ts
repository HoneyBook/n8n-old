import type {
	ICredentialDataDecryptedObject,
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IPollFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

type thisT = IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions;

export async function requestWithAuthentication(this: thisT, options: IHttpRequestOptions) {
	const defaultCredentials = ((await this.getDefaultCredentials('honeyBookApi')) ||
		{}) as ICredentialDataDecryptedObject;

	options.qs = { ...options.qs, ...defaultCredentials };

	return await this.helpers.httpRequest(options);
}

export async function honeyBookApiRequest(
	this: thisT,
	method: IHttpRequestMethods,
	resource: string,

	body: IDataObject = {},
	qs: IDataObject = {},
	uri?: string,
	option: IDataObject = {},
): Promise<any> {
	try {
		let options: IHttpRequestOptions = {
			headers: {},
			method,
			qs,
			body,
			url: uri ?? `http://localhost:3000/api/v2${resource}`,
			json: true,
		};
		options = Object.assign({}, options, option);
		if (Object.keys(body).length === 0) {
			delete options.body;
		}

		return await requestWithAuthentication.call(this, options);
	} catch (error) {
		console.log('=== HB API REQUEST ERROR ===', error);
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
