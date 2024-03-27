import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { baseActionPayload } from './actionsUtils';
import { honeyBookApiRequest } from '@utils/honeyBookApi';

const ACTIONS_API_PATH = '/automations/actions';

async function movePipelineStage(this: IExecuteFunctions): Promise<IDataObject> {
	const payload = {
		...baseActionPayload.call(this),
		pipeline_stage_id: this.getNodeParameter('pipelineStageId', 0),
	};
	await honeyBookApiRequest.call(this, 'POST', ACTIONS_API_PATH + '/move_pipeline_stage', payload);

	return { success: true };
}

async function sendEmail(this: IExecuteFunctions): Promise<IDataObject> {
	const payload = {
		...baseActionPayload.call(this),
		email_template_id: this.getNodeParameter('emailTemplateId', 0),
	};
	await honeyBookApiRequest.call(this, 'POST', ACTIONS_API_PATH + '/send_email', payload);

	return { success: true };
}

type IActionFunction = (this: IExecuteFunctions) => Promise<IDataObject>;

export const actions: Record<string, IActionFunction> = {
	move_pipeline_stage: movePipelineStage,
	send_email: sendEmail,
};
