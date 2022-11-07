import style from "./Button.module.css";

function Button({
  handleClick = () => null,
  children,
}: {
  handleClick?: Function;
  children: JSX.Element;
}) {
  return <button className={style.button}>{children}</button>;
}

export default Button;
