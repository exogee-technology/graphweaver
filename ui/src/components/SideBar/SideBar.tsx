import { useState } from "react";
import style from "./SideBar.module.css";
import graphweaverLogo from "../../assets/img/graphweaver-logo.svg";
import databaseIcon16 from "../../assets/img/16-database.svg";

const sideBarData: Array<object> = [
  {
    id: 1,
    name: "database 1",
    children: [
      {
        id: 1,
        name: "Sub 1",
      },
      {
        id: 2,
        name: "Sub 2",
      },
      {
        id: 3,
        name: "Sub 3",
      },
    ],
  },
  {
    id: 2,
    name: "database 2",
    children: [
      {
        id: 1,
        name: "Sub 1",
      },
      {
        id: 2,
        name: "Sub 2",
      },
      {
        id: 3,
        name: "Sub 3",
      },
    ],
  },
];

function SubListItem({
  child,
  active,
  handleClick,
}: {
  child: any;
  handleClick: Function;
  active: string;
}) {
  return (
    <li>
      <a
        onClick={(e) => {
          e.preventDefault();
          handleClick();
        }}
        className={`${style.subListItem} ${active}`}
        href="/#"
      >
        <span></span>
        {child.name}
      </a>
    </li>
  );
}

function SideBarEntity() {
  const [activeSubItem, setActiveSubItem] = useState(-1);
  const [entityExpandedState, setEntityExpandedState] = useState(sideBarData);

  function expandContractEntity(entity: any) {
    const newentityExpandedState: Array<any> = entityExpandedState.map(
      (menuItem: any) => {
        if (menuItem.id === entity.id) {
          return {
            ...menuItem,
            expanded: !("expanded" in menuItem) ? true : !menuItem.expanded,
          };
        } else {
          return { ...menuItem, expanded: false };
        }
      }
    );

    setEntityExpandedState(newentityExpandedState);
  }

  return (
    <>
      {entityExpandedState.map((entity: any) => (
        <ul key={entity.id} className={style.entity}>
          <li className={entity.expanded ? style.open : style.closed}>
            <a
              href="/#"
              onClick={(e) => {
                e.preventDefault();
                expandContractEntity(entity);
              }}
            >
              <span>
                <img height={16} src={databaseIcon16} alt="Database icon" />
              </span>
              {entity.name}
            </a>
            <ul>
              {entity.children.map((child: any) => (
                <SubListItem
                  handleClick={() => setActiveSubItem(child.id)}
                  active={
                    activeSubItem === child.id ? style.active : "not-active"
                  }
                  key={child.id}
                  child={child}
                />
              ))}
            </ul>
          </li>
        </ul>
      ))}
    </>
  );
}

function DataSources() {
  return (
    <div id={style.sideBarMenu}>
      <img
        className={style.logo}
        width="52"
        src={graphweaverLogo}
        alt="Graphweaver logo."
      />
      <p className={style.subtext}>Data sources</p>
      <SideBarEntity />
    </div>
  );
}

function BlankSlate() {
  return (
    <div id={style.sideBar}>
      <div className={style.blankSlate}>
        <img width="52" src={graphweaverLogo} alt="No database yet, add one." />
      </div>
    </div>
  );
}

function SideBar({ hasData }: { hasData: boolean }) {
  return <>{hasData ? <DataSources /> : <BlankSlate />}</>;
}

export default SideBar;
