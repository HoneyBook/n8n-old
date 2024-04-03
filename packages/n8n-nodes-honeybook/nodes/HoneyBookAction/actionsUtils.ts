import type {IDataObject, IExecuteFunctions} from 'n8n-workflow';

function getWorkspaceId(this: IExecuteFunctions): string {
	// our trigger node saves the workspace id in the global static data
	// but when testing a workflow, it's not saved so we need to get it from the input data
	return (this.getWorkflowStaticData('global').workspaceId ??
		this.getInputData()[0].json.workspace_id) as string ?? (this.getInputData()[0].json.body as IDataObject)?.workspace_id as string;
}

export function baseActionPayload(this: IExecuteFunctions) {
	return {
		workspace_id: getWorkspaceId.call(this),
		workflow_id: this.getWorkflow().id,
		workflow_title: this.getWorkflow().name,
		step_id: this.getNode().id,
	};
}
