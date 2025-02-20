import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Router as WouterRouter, Route, Switch, Redirect } from 'wouter';
import {
	Loader,
	DefaultLayout,
	DefaultErrorFallback,
	DetailPanel,
	Page404,
} from '@exogee/graphweaver-admin-ui-components';

// This is injected by vite-plugin-graphweaver
import { customPages } from 'virtual:graphweaver-user-supplied-custom-pages';
import { loadRoutes as loadAuthRoutes } from 'virtual:graphweaver-auth-ui-components';

import { List, Root, Playground, TraceDetail } from './pages';

export type RouteObject = {
	path: string;
	element: React.ReactNode;
	children?: RouteObject[];
};

export const Router = () => {
	const [routes, setRoutes] = useState<RouteObject[] | null>(null);

	useEffect(() => {
		(async () => {
			setRoutes([...(await customPages.routes()), ...loadAuthRoutes()]);
		})();
	}, []);

	if (!routes) return <Loader />;

	return (
		<ErrorBoundary FallbackComponent={DefaultErrorFallback}>
			<WouterRouter base={import.meta.env.VITE_ADMIN_UI_BASE}>
				<Switch>
					{/* render the custom routes allowing them to override our default routes */}
					{routes.map((route) => (
						<Route key={route.path} path={route.path} nest>
							{route.element}

							{/* recurse into the children routes */}
							{route.children?.map((child) => (
								<Route key={child.path} path={child.path} nest>
									{child.element}
								</Route>
							))}
						</Route>
					))}

					{/* render the default routes */}
					<Route path="/">
						<DefaultLayout>
							{customPages.defaultRoute && customPages.defaultRoute !== '/' ? (
								<Redirect to={customPages.defaultRoute} />
							) : (
								<Root />
							)}
						</DefaultLayout>
					</Route>

					<Route path="/trace/:id">
						<DefaultLayout>
							<TraceDetail />
						</DefaultLayout>
					</Route>

					<Route path="/loader">
						<DefaultLayout>
							<Loader />
						</DefaultLayout>
					</Route>

					<Route path="/playground">
						<Playground />
					</Route>

					<Route path="/:entity/:id?">
						<DefaultLayout>
							<List>
								<Route path="/:entity/:id">
									<DetailPanel />
								</Route>
							</List>
						</DefaultLayout>
					</Route>

					<Route>
						<Page404 />
					</Route>
				</Switch>
			</WouterRouter>
		</ErrorBoundary>
	);
};
