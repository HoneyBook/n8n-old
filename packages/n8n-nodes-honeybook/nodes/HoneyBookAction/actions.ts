import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { baseActionPayload } from './actionsUtils';
import { honeyBookApiRequest } from '@utils/honeyBookApi';

const ACTIONS_API_PATH = '/automations/actions';

async function movePipelineStage(this: IExecuteFunctions): Promise<IDataObject> {
	const payload = {
		...baseActionPayload.call(this),
		pipeline_stage_id: this.getNodeParameter('pipelineStageId', 0),
	};
	return await honeyBookApiRequest.call(this, 'POST', ACTIONS_API_PATH + '/move_pipeline_stage', payload);
}

async function sendEmail(this: IExecuteFunctions): Promise<IDataObject> {
	const payload = {
		...baseActionPayload.call(this),
		email_template_id: this.getNodeParameter('emailTemplateId', 0),
	};
	return await honeyBookApiRequest.call(this, 'POST', ACTIONS_API_PATH + '/send_email', payload);
}

async function sendFlowViaEmail(this: IExecuteFunctions): Promise<IDataObject> {
	const payload = {
		...baseActionPayload.call(this),
		email_template_id: this.getNodeParameter('emailTemplateId', 0),
		file_template_id: this.getNodeParameter('fileTemplateId', 0),
	};
	return await honeyBookApiRequest.call(this, 'POST', ACTIONS_API_PATH + '/send_flow_via_email', payload);
}

async function createTask(this: IExecuteFunctions): Promise<IDataObject> {
	const payload = {
		...baseActionPayload.call(this),
		assignee_id: this.getNodeParameter('assigneeId', 0),
		description: this.getNodeParameter('description', 0),
	};
	return await honeyBookApiRequest.call(this, 'POST', ACTIONS_API_PATH + '/create_task', payload);
}

type IActionFunction = (this: IExecuteFunctions) => Promise<IDataObject>;

export const actions: Record<string, IActionFunction> = {
	move_pipeline_stage: movePipelineStage,
	send_email: sendEmail,
	send_flow_via_email: sendFlowViaEmail,
	create_task: createTask,
};
