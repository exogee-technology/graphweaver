import style from "./Button.module.css";

function Button({
  handleClick = () => null,
  children,
  iconBefore,
}: {
  handleClick?: Function;
  children: JSX.Element | string;
  iconBefore?: string;
}) {
  function hasIconBefore() {
    if (iconBefore) {
      return true;
    }
  }
  return (
    <button className={style.button}>
      <>
        {hasIconBefore() ? <img src={iconBefore} alt="Icon" /> : null}
        {children}
      </>
    </button>
  );
}

export default Button;
