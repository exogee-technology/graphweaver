import { useState } from "react";
import style from "./Button.module.css";

function DropdownItems({ items }: { items: Array<object> }) {
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
    <ul className={showDropdown ? style.dropdown : style.hide}>
      <DropdownItems items={dropdownItems} />
    </ul>
  );
}

function Button({
  handleClick = () => null,
  children,
  iconBefore,
  iconAfter,
  dropdown = false,
  dropdownItems = [{ name: "Add links array", href: "some_url" }],
}: {
  handleClick?: Function;
  children: JSX.Element | string;
  iconBefore?: string;
  iconAfter?: string;
  dropdown?: boolean;
  dropdownItems?: Array<object>;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  function hasIconBefore() {
    return iconBefore ? true : false;
  }

  function hasIconAfter() {
    return iconAfter ? true : false;
  }

  function handleLocalClick() {
    return dropdown ? setShowDropdown(!showDropdown) : false;
  }

  function renderDropdown() {
    if (dropdown) {
      return (
        <Dropdown showDropdown={showDropdown} dropdownItems={dropdownItems} />
      );
    }
  }

  return (
    <button onClick={handleLocalClick} className={style.button} type="button">
      <>
        {hasIconBefore() ? <img src={iconBefore} alt="Icon" /> : null}
        {children}
        {hasIconAfter() ? <img src={iconAfter} alt="Icon" /> : null}
        {renderDropdown()}
      </>
    </button>
  );
}

export default Button;
