export const getOne = async <C>(source: unknown, args: unknown, context: C) => {
	console.log('getOne', source, args, context);
};

export const list = async <C>(source: unknown, args: unknown, context: C) => {
	console.log('list', source, args, context);
};
