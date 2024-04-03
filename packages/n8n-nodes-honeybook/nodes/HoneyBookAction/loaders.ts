/* eslint-disable n8n-nodes-base/node-param-display-name-miscased */
/* eslint-disable n8n-nodes-base/node-param-options-type-unsorted-items */
import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

/**
 * These methods return mock data so we can play with the nodes in n8n UI.
 * In reality we will probably not use these methods - HB frontend will send the method name to HB backend,
 * and HB backend will resolve the query directly (instead of sending the method name to n8n which will use this code
 * to send a request to HB backend). See:
 */
export async function getPipelineStages(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return [
		{
			name: 'Meeting scheduled',
			value: '650b468ff1e8d80008d1e8b4',
		},
		{
			name: 'Proposal sent',
			value: '2',
		},
	];
}

export async function getEmailTemplates(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return [
		{
			name: 'Automations',
			value: '6601893bbacc956acec44c68',
		},
		{
			name: 'Get ready email',
			value: '2',
		},
	];
}

export async function getFileTemplates(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return [
		{
			name: 'Copy of Wedding Day Questionnaire',
			value: '65b7729bbacc95a960b1936b',
		},
		{
			name: 'Full proposal template',
			value: '2',
		},
	];
}

export async function getTeamMembers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return [
		{
			name: 'Hannah Martin',
			value: '643f0c51ce702d002ea10146',
		},
		{
			name: 'Bob Smith',
			value: '2',
		},
	];
}
