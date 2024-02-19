import { BaseCommand } from './BaseCommand';
import { Args } from '@oclif/core';
import { NodeTypes } from '@/NodeTypes';
import { Container } from 'typedi';
import type { INode, IWorkflowExecuteAdditionalData, ITaskDataConnections } from 'n8n-workflow';
import { Node, Workflow } from 'n8n-workflow';
import * as NodeExecuteFunctions from 'n8n-core';

export class ExecuteNode extends BaseCommand {
	static strict = false;

	static args = {
		type: Args.string(),
		parameters: Args.string(),
		input: Args.string(),
		credentials: Args.string(),
	};

	async run() {
		const { args } = await this.parse(ExecuteNode);
		const type = args.type;
		const parameters = JSON.parse(args.parameters);
		const input = JSON.parse(args.input);
		const credentials = JSON.parse(args.credentials);
		this.log(`Executing node of type: ${type}`);

		const nodeTypes = Container.get(NodeTypes);
		const nodeType = nodeTypes.getByNameAndVersion(type);
		const credentialsType = nodeType.description.credentials[0].name;

		const node: INode = {
			id: '123',
			type,
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
		};

		const additionalData: IWorkflowExecuteAdditionalData = {
			credentialsHelper,
		};

		const context = NodeExecuteFunctions.getExecuteFunctions(
			workflow, // workflow
			{}, // runExecutionData
			0, // runIndex
			{}, // connectionInputData
			inputData, // inputData
			node,
			additionalData, // additionalData,
			{}, // executionData,
			'cli', // mode,
			[], // closeFunctions,
			null, // abortSignal,
		);

		const data =
			nodeType instanceof Node
				? await nodeType.execute(context)
				: await nodeType.execute.call(context);

		this.log(`Executing node of type: ${type} success!`);

		return JSON.stringify(data);
	}

	async catch(error: Error) {
		this.logger.error('Error in executeNode');
		this.logger.info('====================================');
		this.logger.error(error.message);
		this.logger.error(error.stack!);
	}
}
