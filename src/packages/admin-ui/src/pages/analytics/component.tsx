import { useQuery } from '@apollo/client';

import { queryForTrace } from './graphql';

import styles from './styles.module.css';

import { GraphQlEditor, Header, TraceViewer } from '@exogee/graphweaver-admin-ui-components';
import { useEffect, useRef, useState } from 'react';

const TRACE_VIEW_MIN_HEIGHT = 220;

export const Analytics = () => {
	const resizer = useRef<HTMLDivElement>(null);
	const [flexBasis, setFlexBasis] = useState(TRACE_VIEW_MIN_HEIGHT);

	// startPositionY is the starting position of the mouse when resizing
	const startPositionY = useRef<number | null>(null);

	// editorHeight is the height of the editor when not resizing
	// editorHeightWhileResizing is the height of the editor while resizing
	// We can't use flexBasis directly because it will be set to the new height of the editor
	const editorHeight = useRef<number>(TRACE_VIEW_MIN_HEIGHT);
	const editorHeightWhileResizing = useRef<number>(TRACE_VIEW_MIN_HEIGHT);

	const { data, loading, error } = useQuery(queryForTrace);

	const resize = (event: { clientY: number }) => {
		if (startPositionY.current !== null) {
			const size = (event.clientY - startPositionY.current) * -1 + editorHeight.current;
			console.log(size, flexBasis);
			if (size >= TRACE_VIEW_MIN_HEIGHT) {
				editorHeightWhileResizing.current = size;
				setFlexBasis(size);
			}
		}
	};

	useEffect(() => {
		const removeListener = () => {
			// Now we have stopped resizing the editor, we can set the new height
			editorHeight.current = editorHeightWhileResizing.current;
			document.removeEventListener('mousemove', resize, false);
		};

		const trackMovement = (event: any) => {
			if (resizer.current && resizer.current?.contains(event?.target as HTMLDivElement)) {
				// Store the starting position of the mouse
				startPositionY.current = event.clientY;
				document.addEventListener('mousemove', resize, false);
				document.addEventListener('mouseup', removeListener, false);
			}
		};

		document.addEventListener('mousedown', trackMovement);
		return () => {
			document.removeEventListener('mousedown', trackMovement);
			document.removeEventListener('mouseup', removeListener);
		};
	}, []);

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
			<TraceViewer trace={data} />
			<div
				className={styles.trace}
				style={{ ...(flexBasis ? { flexBasis: `${flexBasis}px` } : {}) }}
			>
				<div className={styles.resizer} ref={resizer}></div>
				<GraphQlEditor />
			</div>
		</div>
	);
};
