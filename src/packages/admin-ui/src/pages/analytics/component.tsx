import { useQuery } from '@apollo/client';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { GraphQlViewer, Header, TraceViewer } from '@exogee/graphweaver-admin-ui-components';

import { queryForTrace } from './graphql';

import styles from './styles.module.css';

export const Analytics = () => {
	const { data, loading, error } = useQuery(queryForTrace);

	if (loading) return <div className={styles.wrapper}>Loading...</div>;
	if (error) return <div className={styles.wrapper}>Error: {error.message}</div>;

	return (
		<div className={styles.wrapper}>
			<Header>
				<div className="titleWrapper">
					<h1>Trace</h1>
					<p className="subtext">{'Detailed trace view for a376436d11e530e2a47efe2d43d7f9ec'}</p>
				</div>
			</Header>
			<PanelGroup direction="vertical">
				<Panel maxSize={80}>
					<TraceViewer trace={data} />
				</Panel>
				<PanelResizeHandle className={styles.handle} />
				<Panel maxSize={80} defaultSize={40}>
					<GraphQlViewer />
				</Panel>
			</PanelGroup>
		</div>
	);
};
