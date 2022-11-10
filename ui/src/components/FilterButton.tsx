import { useState } from "react";
import style from "./Button.module.css";

function DropdownItems({
  items,
  handleClick,
}: {
  items: Array<object>;
  handleClick: Function;
}) {
  return (
    <>
      {items.map((item: any) => (
        <li key={Math.random()}>
          <a href={item.href}>{item.name}</a>
        </li>
      ))}
    </>
  );
}

function Dropdown({
  showDropdown,
  dropdownItems,
}: {
  showDropdown: boolean;
  dropdownItems: Array<object>;
}) {
  return (
    <>
      {showDropdown ? (
        <ul className={style.dropdown}>
          <DropdownItems items={dropdownItems} />
        </ul>
      ) : null}
    </>
  );
}

function Button({
  handleClick = () => null,
  children,
  iconBefore,
  dropdown = false,
  dropdownItems = [{ name: "Add links array", href: "some_url" }],
}: {
  handleClick?: Function;
  children: JSX.Element | string;
  iconBefore?: string;
  dropdown?: boolean;
  dropdownItems?: Array<object>;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  function hasIconBefore() {
    if (iconBefore) {
      return true;
    }
  }

  function handleLocalClick() {
    if (dropdown) {
      setShowDropdown(!showDropdown);
    }
  }
  return (
    <button onClick={handleLocalClick} className={style.button} type="button">
      <>
        {hasIconBefore() ? <img src={iconBefore} alt="Icon" /> : null}
        {children}
        {dropdown ? (
          <Dropdown
            showDropdown={showDropdown}
            dropdownItems={dropdownItems}
            updateTable={handleClick}
          />
        ) : null}
      </>
    </button>
  );
}

export default Button;
