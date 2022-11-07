import style from "./Home.module.css";
import SideBar from "../../components/SideBar/SideBar";
import Table from "../../components/Table/Table";
import dataSourcesIcon from "../../assets/img/64-data-sources.svg";
import openPlaygroundIcon from "../../assets/img/16-open-external.svg";
import filterIcon from "../../assets/img/16-filter.svg";
import Button from "../../components/Button";
import { useState } from "react";

function BlankSlate() {
  return (
    <div id={style.centerBlankSlate}>
      <div className={style.blankSlateWrapper}>
        <img width="64" src={dataSourcesIcon} alt="No data sources icon" />
        <h1>No data sources yet</h1>

        <p className="subtext">
          Connect data sources. See the <a href="/#">readme</a> for more details
        </p>
      </div>
    </div>
  );
}

function ToolBar() {
  const [searchParam, setSearchParam] = useState("");

  let timeOut: any;

  const handleChange = (e: any) => {
    clearTimeout(timeOut);

    timeOut = setTimeout(() => {
      console.log(e.target.value);
    }, 500);
  };

  return (
    <div className={style.toolBarWrapper}>
      <div className="titleWrapper">
        <h1>endpoint</h1>
        <p className="subtext">somedomain.com/api/endpoint</p>
      </div>

      <div className={style.toolsWrapper}>
        <input
          className={style.search}
          type="search"
          name="search"
          placeholder="Search..."
          onChange={handleChange}
        />
        <Button>
          <>
            <span>
              <img width={16} src={filterIcon} alt="Open playground" />
            </span>
            <p>Filter</p>
          </>
        </Button>
        <Button>
          <>
            <p>Open playground</p>
            <span>
              <img width={16} src={openPlaygroundIcon} alt="Open playground" />
            </span>
          </>
        </Button>
      </div>
    </div>
  );
}

function MainScreen() {
  return (
    <>
      <Table />
    </>
  );
}

function Home({ hasData }: { hasData: boolean }) {
  return (
    <div id={style.mainContentWrapper}>
      {hasData ? <ToolBar /> : null}
      <SideBar hasData={hasData} />
      {hasData ? <MainScreen /> : <BlankSlate />}
    </div>
  );
}

export default Home;
