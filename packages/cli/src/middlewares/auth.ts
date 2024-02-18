import type { Application, NextFunction, Request, RequestHandler, Response } from 'express';
import { Container } from 'typedi';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { BasicStrategy } from 'passport-http';
import { sync as globSync } from 'fast-glob';
import type { JwtPayload } from '@/Interfaces';
import type { AuthenticatedRequest } from '@/requests';
import { AUTH_COOKIE_NAME, EDITOR_UI_DIST_DIR } from '@/constants';
import { issueCookie, resolveJwtContent } from '@/auth/jwt';
import { canSkipAuth } from '@/decorators/registerController';
import { Logger } from '@/Logger';
import { JwtService } from '@/services/jwt.service';
import config from '@/config';
import { UserRepository } from '@db/repositories/user.repository';

const jwtFromRequest = (req: Request) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	return (req.cookies?.[AUTH_COOKIE_NAME] as string | undefined) ?? null;
};

const userManagementJwtAuth = (): RequestHandler => {
	const jwtStrategy = new Strategy(
		{
			jwtFromRequest,
			secretOrKey: Container.get(JwtService).jwtSecret,
		},
		async (jwtPayload: JwtPayload, done) => {
			try {
				const user = await resolveJwtContent(jwtPayload);
				return done(null, user);
			} catch (error) {
				Container.get(Logger).debug('Failed to extract user from JWT payload', { jwtPayload });
				return done(null, false, { message: 'User not found' });
			}
		},
	);

	passport.use('n8n-jwt', jwtStrategy);
	return passport.initialize();
};

const honeyBookJwtAuth = (): RequestHandler => {
	const jwtStrategy = new Strategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: '123',
		},
		async (jwtPayload: JwtPayload, done) => {
			try {
				const { email } = jwtPayload;
				const user = await Container.get(UserRepository).findOne({
					where: { email: email! },
				});

				if (user) {
					return done(null, user);
				}

				return done(null, false, { message: 'User not found' });
			} catch (error) {
				Container.get(Logger).debug('Failed to extract user from JWT payload', { jwtPayload });
				return done(null, false, { message: 'User not found' });
			}
		},
	);

	passport.use('hb-jwt', jwtStrategy);
	return passport.initialize();
};

const userManagementBasicAuth = (): RequestHandler => {
	const basicStrategy = new BasicStrategy(async (name: string, password: string, done) => {
		try {
			const user = await Container.get(UserRepository).findOne({
				where: { email: name },
			});
			return done(null, user);
		} catch (error) {
			Container.get(Logger).debug('Failed to extract user from basic auth payload', { name });
			return done({ message: 'User not found' }, null);
		}
	});

	passport.use('basic', basicStrategy);
	return passport.initialize();
};

/**
 * middleware to refresh cookie before it expires
 */
export const refreshExpiringCookie = (async (req: AuthenticatedRequest, res, next) => {
	const jwtRefreshTimeoutHours = config.get('userManagement.jwtRefreshTimeoutHours');

	let jwtRefreshTimeoutMilliSeconds: number;

	if (jwtRefreshTimeoutHours === 0) {
		const jwtSessionDurationHours = config.get('userManagement.jwtSessionDurationHours');

		jwtRefreshTimeoutMilliSeconds = Math.floor(jwtSessionDurationHours * 0.25 * 60 * 60 * 1000);
	} else {
		jwtRefreshTimeoutMilliSeconds = Math.floor(jwtRefreshTimeoutHours * 60 * 60 * 1000);
	}

	const cookieAuth = jwtFromRequest(req);

	if (cookieAuth && req.user && jwtRefreshTimeoutHours !== -1) {
		const cookieContents = jwt.decode(cookieAuth) as JwtPayload & { exp: number };
		if (cookieContents.exp * 1000 - Date.now() < jwtRefreshTimeoutMilliSeconds) {
			await issueCookie(res, req.user);
		}
	}
	next();
}) satisfies RequestHandler;

// TODO: Oz: we can uncomment this to change the internal API auth to basic auth
// const passportMiddleware = passport.authenticate('basic', { session: false }) as RequestHandler;
const passportMiddleware = passport.authenticate(['n8n-jwt', 'hb-jwt', 'basic'], { session: false }) as RequestHandler;

const staticAssets = globSync(['**/*.html', '**/*.svg', '**/*.png', '**/*.ico'], {
	cwd: EDITOR_UI_DIST_DIR,
});

// TODO: delete this
const isPostInvitationAccept = (req: Request, restEndpoint: string): boolean =>
	req.method === 'POST' &&
	new RegExp(`/${restEndpoint}/invitations/[\\w\\d-]*`).test(req.url) &&
	req.url.includes('accept');

const isAuthExcluded = (url: string, ignoredEndpoints: Readonly<string[]>): boolean =>
	!!ignoredEndpoints
		.filter(Boolean) // skip empty paths
		.find((ignoredEndpoint) => url.startsWith(`/${ignoredEndpoint}`));

/**
 * This sets up the auth middlewares in the correct order
 */
export const setupAuthMiddlewares = (
	app: Application,
	ignoredEndpoints: Readonly<string[]>,
	restEndpoint: string,
) => {
	app.use(userManagementJwtAuth());
	app.use(honeyBookJwtAuth());
	app.use(userManagementBasicAuth());

	app.use(async (req: Request, res: Response, next: NextFunction) => {
		if (
			// TODO: refactor me!!!
			// skip authentication for preflight requests
			req.method === 'OPTIONS' ||
			staticAssets.includes(req.url.slice(1)) ||
			canSkipAuth(req.method, req.path) ||
			isAuthExcluded(req.url, ignoredEndpoints) ||
			req.url.startsWith(`/${restEndpoint}/settings`) ||
			isPostInvitationAccept(req, restEndpoint)
		) {
			return next();
		}

		return passportMiddleware(req, res, next);
	});

	app.use(refreshExpiringCookie);
};
