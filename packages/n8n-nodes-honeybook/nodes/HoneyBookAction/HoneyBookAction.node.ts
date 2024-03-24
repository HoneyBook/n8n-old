/* eslint-disable n8n-nodes-base/node-param-display-name-miscased */
/* eslint-disable n8n-nodes-base/node-param-options-type-unsorted-items */
import type {
	INodeType,
	INodeTypeDescription,
	IHookFunctions,
	IExecuteFunctions,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
	createTaskProperties,
	movePipelineStageProperties,
	sendEmailProperties,
	sendFilesProperties,
	withActionDisplayOptions,
} from './properties';
import { getPipelineStages, getEmailTemplates, getFileTemplates, getTeamMembers } from './loaders';
import { actions } from './actions';

export class HoneyBookAction implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Action',
		name: 'honeyBookAction',
		icon: 'file:honeybook.svg',
		group: ['input', 'HoneyBook'],
		version: 1,
		subtitle: '={{$parameter["action"]}}',
		description: 'Consume HB API',
		defaults: {
			name: 'Action',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'honeyBookApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send email',
						value: 'send_email',
					},
					{
						name: 'Send file via email',
						value: 'send_file_via_email',
					},
					{
						name: 'Create task',
						value: 'create_task',
					},
					{
						name: 'Move pipeline stage',
						value: 'move_pipeline_stage',
					},
				],
				default: null,
			},
			...withActionDisplayOptions('send_email', sendEmailProperties),
			...withActionDisplayOptions('send_file_via_email', sendFilesProperties),
			...withActionDisplayOptions('create_task', createTaskProperties),
			...withActionDisplayOptions('move_pipeline_stage', movePipelineStageProperties),
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return true;
			},
		},
	};

	methods = {
		loadOptions: {
			getPipelineStages,
			getEmailTemplates,
			getFileTemplates,
			getTeamMembers,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// workspaceId is saved by our trigger node
		const action = this.getNodeParameter('action', 0) as string;

		const actionFn = actions[action];
		if (!actionFn) {
			throw new NodeOperationError(this.getNode(), `The action "${action}" is not known!`);
		}

		const responseData = await actionFn.call(this);
		return [this.helpers.returnJsonArray(responseData)];
	}
}
