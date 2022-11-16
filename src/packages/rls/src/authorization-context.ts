class RowLevelSecurityContextImplementation {
	private getRolesFunction: () => string[];

	constructor() {
		this.getRolesFunction = () => [];
	}

	public setContext(getRolesFunction: () => string[]) {
		this.getRolesFunction = getRolesFunction;
	}

	public getRoles = () => {
		const roles = this.getRolesFunction();
		return roles;
	};
}

export const RlsContext = new RowLevelSecurityContextImplementation();
