import { useState, useEffect, useRef } from "react";
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
  onOutsideClick,
  getParent,
}: {
  showDropdown: boolean;
  dropdownItems: Array<object>;
  onOutsideClick: any;
  getParent: Function;
}) {
  function useOutsideAlerter(ref: any) {
    useEffect(() => {
      function handleClickOutside(e: Event) {
        if (e.target === getParent().current) {
          return;
        }

        if (ref.current && !ref.current.contains(e.target)) {
          onOutsideClick();
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref]);
  }

  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef);

  return (
    <>
      {showDropdown ? (
        <ul
          ref={wrapperRef}
          className={showDropdown ? style.dropdown : style.hide}
        >
          <DropdownItems items={dropdownItems} />
        </ul>
      ) : (
        <></>
      )}
    </>
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
    if (iconBefore) {
      return <img src={iconBefore} alt="Icon" />;
    }
  }

  function hasIconAfter() {
    if (iconAfter) {
      return <img src={iconAfter} alt="Icon" />;
    }
  }

  function handleLocalClick() {
    return dropdown ? setShowDropdown(!showDropdown) : false;
  }

  function hasDropdown() {
    if (dropdown) {
      return (
        <Dropdown
          onOutsideClick={() => setShowDropdown(false)}
          getParent={getParent}
          showDropdown={showDropdown}
          dropdownItems={dropdownItems}
        />
      );
    }
  }

  // To refer to when clicking outside dropdown
  const parentRef = useRef(null);
  function getParent() {
    return parentRef;
  }

  return (
    <button
      ref={parentRef}
      onClick={handleLocalClick}
      className={style.button}
      type="button"
    >
      <>
        {hasIconBefore()}
        {children}
        {hasIconAfter()}
        {hasDropdown()}
      </>
    </button>
  );
}

export default Button;
