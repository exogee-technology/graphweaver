import { useState } from "react";
import style from "./Button.module.css";

function DropdownItem({
  handleClick,
  children,
}: {
  handleClick: any;
  children: JSX.Element | string;
}) {
  return <li onClick={handleClick}>{children}</li>;
}

function Dropdown({
  showDropdown,
  onUpdate,
}: {
  showDropdown: boolean;
  onUpdate: any;
}) {
  const handleLocal = () => {
    onUpdate("some param");
  };

  return (
    <ul className={showDropdown ? style.dropdown : style.hide}>
      <DropdownItem handleClick={() => handleLocal()}>Some link</DropdownItem>
    </ul>
  );
}

function Button({
  handleClick = () => null,
  children,
  iconBefore,
  dropdown = false,
  onUpdate,
}: {
  handleClick?: Function;
  children: JSX.Element | string;
  iconBefore?: string;
  dropdown?: boolean;
  onUpdate?: Function;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  function hasIconBefore() {
    return iconBefore ? true : false;
  }

  function showHidDropdown() {
    return dropdown ? setShowDropdown(!showDropdown) : false;
  }
  return (
    <button onClick={showHidDropdown} className={style.button} type="button">
      <>
        {hasIconBefore() ? <img src={iconBefore} alt="Icon" /> : null}
        {children}
        {dropdown ? (
          <Dropdown showDropdown={showDropdown} onUpdate={onUpdate} />
        ) : null}
      </>
    </button>
  );
}

export default Button;
