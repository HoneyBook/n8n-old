import { BaseCommand } from './BaseCommand';
import { Args } from '@oclif/core';
import { NodeTypes } from '@/NodeTypes';
import { CredentialTypes } from '@/CredentialTypes';
import { Container } from 'typedi';
import type {INode, IWorkflowExecuteAdditionalData, ITaskDataConnections, INodeType} from 'n8n-workflow';
import {Node, Workflow, WorkflowActivateMode, WorkflowExecuteMode} from 'n8n-workflow';
import * as NodeExecuteFunctions from 'n8n-core';

export class ExecuteNode extends BaseCommand {
	static strict = false;

	static args = {
		nodeTypeId: Args.string(), // i.e. n8n-nodes-base.mongoDb
		executionType: Args.string(), // execute / poll / trigger
		parameters: Args.string(),
		input: Args.string(),
		credentials: Args.string(),
	};

	async run() {
		const { args } = await this.parse(ExecuteNode);
		const nodeTypeId = args.nodeTypeId;
		const executionType = args.executionType;
		const parameters = JSON.parse(args.parameters);
		const input = JSON.parse(args.input);
		const credentials = JSON.parse(args.credentials);
		this.logger.info(`Executing node`, { nodeTypeId, executionType });

		const nodeTypes = Container.get(NodeTypes);
		const nodeType = nodeTypes.getByNameAndVersion(nodeTypeId);
		const credentialsType = credentials.type;
		delete credentials.type;

		const node: INode = {
			id: '123',
			type: nodeTypeId,
			parameters,
			// we don't really need this because we mock the credentialsHelper
			// but if we don't pass it, we get an error
			credentials: { [credentialsType]: { id: '123' } },
		};

		const workflow = new Workflow({ nodes: [], nodeTypes });

		const inputData: ITaskDataConnections = {
			main: [[input]],
		};

		const credentialsHelper = {
			getDecrypted() {
				return credentials;
			},
			getParentTypes(typeName: string) {
				return Container.get(CredentialTypes).getParentTypes(typeName);
			}
		};

		const additionalData: IWorkflowExecuteAdditionalData = {
			credentialsHelper,
		};

		const workflowExecuteMode: WorkflowExecuteMode = 'manual';
		const activation: WorkflowActivateMode = 'manual';

		let data;
		let webhookData = {};
		switch (executionType) {
			case 'execute':
				const executeFunctions = NodeExecuteFunctions.getExecuteFunctions(
					workflow, // workflow
					{}, // runExecutionData
					0, // runIndex
					{}, // connectionInputData
					inputData, // inputData
					node,
					additionalData, // additionalData,
					{}, // executionData,
					workflowExecuteMode, // mode,
					[], // closeFunctions,
					null, // abortSignal,
				);

				data = await nodeType.execute.call(executeFunctions);
				break;
			case 'poll':
				const executePollFunctions = NodeExecuteFunctions.getExecutePollFunctions(
					workflow, // Workflow,
					node, // INode,
					additionalData, // IWorkflowExecuteAdditionalData,
					workflowExecuteMode, // WorkflowExecuteMode,
					activation, // WorkflowActivateMode - don't know what this is
				);
				data = await nodeType.poll.call(executePollFunctions);
				webhookData = executePollFunctions.getWorkflowStaticData('node');
				break;
			default:
				throw new Error('Invalid executionType');
		}

		this.logger.info(`Executing node success`, { nodeTypeId, executionType });

		console.log('===RESPONSE===');
		console.log(JSON.stringify({
			data,
			webhookData
		}));
	}

	async catch(error: Error) {
		this.logger.error('Error in executeNode');
		this.logger.info('====================================');
		this.logger.error(error.message);
		this.logger.error(error.stack!);
	}
}
