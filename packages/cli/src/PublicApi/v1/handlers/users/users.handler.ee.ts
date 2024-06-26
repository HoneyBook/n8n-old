import type express from 'express';
import { Container } from 'typedi';

import { clean, getAllUsersAndCount, getUser, createUser, saveUser } from './users.service.ee';

import { encodeNextCursor } from '../../shared/services/pagination.service';
import {
	authorize,
	validCursor,
	validLicenseWithUserQuota,
} from '../../shared/middlewares/global.middleware';
import type { UserRequest } from '@/requests';
import { InternalHooks } from '@/InternalHooks';
import { validUserRole } from '@/PublicApi/v1/handlers/users/users.middlewares';

export = {
	getUser: [
		validLicenseWithUserQuota,
		authorize(['global:owner', 'global:admin']),
		async (req: UserRequest.Get, res: express.Response) => {
			const { includeRole = false } = req.query;
			const { id } = req.params;

			const user = await getUser({ withIdentifier: id, includeRole });

			if (!user) {
				return res.status(404).json({
					message: `Could not find user with id: ${id}`,
				});
			}

			const telemetryData = {
				user_id: req.user.id,
				public_api: true,
			};

			void Container.get(InternalHooks).onUserRetrievedUser(telemetryData);

			return res.json(clean(user, { includeRole }));
		},
	],
	getUsers: [
		validLicenseWithUserQuota,
		validCursor,
		authorize(['global:owner', 'global:admin']),
		async (req: UserRequest.Get, res: express.Response) => {
			const { offset = 0, limit = 100, includeRole = false } = req.query;

			const [users, count] = await getAllUsersAndCount({
				includeRole,
				limit,
				offset,
			});

			const telemetryData = {
				user_id: req.user.id,
				public_api: true,
			};

			void Container.get(InternalHooks).onUserRetrievedAllUsers(telemetryData);

			return res.json({
				data: clean(users, { includeRole }),
				nextCursor: encodeNextCursor({
					offset,
					limit,
					numberOfTotalRecords: count,
				}),
			});
		},
	],
	createUser: [
		validLicenseWithUserQuota,
		validUserRole,
		authorize(['global:owner']),
		async (req: UserRequest.Create, res: express.Response) => {
			const newUser = await createUser(req.body);

			const user = await saveUser(newUser);

			void Container.get(InternalHooks).onUserCreate({ user });

			return res.json(clean(user));
		},
	],
};
