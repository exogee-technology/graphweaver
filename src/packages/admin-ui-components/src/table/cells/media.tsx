export const MediaCell = (value: any) => {
	const media = value as {
		url: string;
		type: 'IMAGE' | 'OTHER';
	};
	if (!media) {
		return null;
	}

	if (media.type === 'IMAGE') {
		return (
			<img
				src={media.url}
				style={{
					width: '200px',
					height: '48px',
					objectFit: 'cover',
					padding: 2,
					borderRadius: 8,
					objectPosition: 'center center',
				}}
				onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) =>
					(e.currentTarget.style.display = 'none')
				}
			/>
		);
	}

	return (
		<a href={media.url} target="_blank" rel="noreferrer">
			{media.url}
		</a>
	);
};
