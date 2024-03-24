import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { honeyBookApiRequest } from '@utils/honeyBookApi';

const ACTIONS_API_PATH = '/automations/actions';

function getWorkspaceId(this: IExecuteFunctions): string {
	// our trigger node saves the workspace id in the global static data
	// but when testing a workflow, it's not saved so we need to get it from the input data
	return (this.getWorkflowStaticData('global').workspaceId ??
		this.getInputData()[0].json.workspace_id) as string;
}

async function movePipelineStage(this: IExecuteFunctions): Promise<IDataObject> {
	const payload = {
		workspace_id: getWorkspaceId.call(this),
		pipeline_stage_id: this.getNodeParameter('pipelineStageId', 0),
	};
	await honeyBookApiRequest.call(this, 'POST', ACTIONS_API_PATH + '/move_pipeline_stage', payload);

	return { success: true };
}

type IActionFunction = (this: IExecuteFunctions) => Promise<IDataObject>;

export const actions: Record<string, IActionFunction> = {
	move_pipeline_stage: movePipelineStage,
};
