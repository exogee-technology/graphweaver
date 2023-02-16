# `@exogee/graphweaver-admin-ui-components`

UI components used in the Admin UI which you can also import and use in your project as you like.

## <Button />

A themed button

```tsx
import { Button } from '@exogee/graphweaver-admin-ui-components';
import { MyIcon } from './icon';

const MyPage = () => {
	const handleOnClick = () => alert('Button Was Clicked');

	return (
		<>
			<Button renderAfter={() => <MyIcon />} onClick={handleOnClickButton}>
				A Button Label
			</Button>
		</>
	);
};
```

## <Dropdown />

A Dropdown Menu

```tsx
...
```
