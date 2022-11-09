import { useState } from "react";
import style from "./Table.module.css";
import chevron from "../../assets/img/16-chevron-down.svg";
import { checkType } from "../../utils/sorting-helpers";

function TableHeader({
  tableData,
  handleClick,
  filterDirection,
}: {
  tableData: Array<object>;
  handleClick: Function;
  filterDirection: boolean;
}) {
  const [filteredColumn, setFilteredColumn] = useState(0);

  const headers = Object.keys(tableData[0]);
  const firstObject: any = tableData[0];

  // When the value is a number right align text
  function valueIsNumber(header: string) {
    return typeof firstObject[header] === "number" ? style.right : "";
  }

  // Pass the column object key so we can filter on that column
  function filterOnColumn(header: string, index: number) {
    handleClick(header);
    setFilteredColumn(index);
  }

  return (
    <tr id={style.header}>
      {headers.map((header: string, index) => (
        <th
          onClick={() => {
            filterOnColumn(header, index);
          }}
          className={valueIsNumber(header)}
          id={filteredColumn === index ? style.chevron : ""}
          key={header}
        >
          {header}
          <span>
            <img
              src={chevron}
              alt={`Filter ${header} ascending or descending`}
              className={filterDirection ? style.pointUp : style.pointDown}
            />
          </span>
        </th>
      ))}
    </tr>
  );
}

function TableRows({ tableData }: { tableData: Array<object> }) {
  const rows = tableData;
  const rowsArray: any = [];

  rows.forEach((row) => {
    rowsArray.push(
      Object.values(row).map((value: any) => (
        <td
          className={typeof value === "number" ? style.right : ""}
          key={Math.random()}
        >
          {value}
        </td>
      ))
    );
  });

  return (
    <>
      {rowsArray.map((value: any, index: number) => (
        <tr key={index}>{value}</tr>
      ))}
    </>
  );
}

function Table({
  tableData,
  updateTable,
  initialData,
}: {
  tableData: Array<any>;
  updateTable: Function;
  initialData: Array<any>;
}) {
  const data = tableData;
  const [columnDirection, setcolumnDirection] = useState(false);

  const sortedOnNumber = (data: any, column: string) => {
    setcolumnDirection((columnDirection) => !columnDirection);
    return columnDirection
      ? data.sort((a: any, b: any) => a[column] - b[column])
      : data.sort((a: any, b: any) => b[column] - a[column]);
  };

  const sortedOnString = (data: any, column: string) => {
    setcolumnDirection((columnDirection) => !columnDirection);
    return columnDirection
      ? data.sort((a: any, b: any) => (a[column] > b[column] ? 1 : -1))
      : data.sort((a: any, b: any) => (a[column] < b[column] ? 1 : -1));
  };

  const sortOnDate = (data: any) =>
    data.sort((a: any, b: any) => {
      const dateA: any = new Date(a.created_at);
      const dateB: any = new Date(b.created_at);
      return dateA - dateB;
    });

  function sortData(toSort: any, type: string | number | Date, data: object) {
    if (type === "number") {
      return sortedOnNumber(data, toSort);
    }

    if (type === "string") {
      return sortedOnString(data, toSort);
    }

    if (type === "sortOnDate") {
      return sortedOnString(data, toSort);
    }
  }

  function sortDataFromColumn(header: any) {
    const type: any = checkType(initialData[0][header]);
    const sortedData = sortData(header, type, data);
    updateTable([...sortedData]);
  }

  return (
    <div id={style.tableWrapper}>
      <table id={style.table}>
        <tbody>
          <TableHeader
            handleClick={sortDataFromColumn}
            filterDirection={columnDirection}
            tableData={initialData}
          />
          <TableRows tableData={data} />
        </tbody>
      </table>
    </div>
  );
}

export default Table;
