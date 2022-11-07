import { useState } from "react";
import style from "./Table.module.css";

const tableData: Array<object> = [
  {
    id: 1,
    name: "Martin",
    age: 32,
    email: "martin@exogee.com",
    role: "admin",
    created_at: "2022-10-28 11:30:21",
  },

  {
    id: 2,
    name: "Maria",
    age: 42,
    email: "maria@exogee.com",
    role: "admin",
    created_at: "2022-10-28 11:20:21",
  },

  {
    id: 3,
    name: "Christofer",
    age: 24,
    email: "christofer@exogee.com",
    role: "user",
    created_at: "2022-10-28 11:45:21",
  },
  {
    id: 4,
    name: "Christofer",
    age: 5,
    email: "christofer@exogee.com",
    role: "user",
    created_at: "2022-10-28 12:50:21",
  },
];

function TableHeader({
  tableData,
  handleClick,
}: {
  tableData: Array<object>;
  handleClick: Function;
}) {
  const headers = Object.keys(tableData[0]);

  const singleObject: any = tableData[0];

  // When the value is a number right align text
  function valueIsNumber(header: string) {
    return typeof singleObject[header] === "number" ? style.right : "";
  }

  function passColumnKey(header: string) {
    handleClick(header);
  }

  return (
    <tr id={style.header}>
      {headers.map((header: string) => (
        <th
          onClick={() => passColumnKey(header)}
          className={valueIsNumber(header)}
          key={header}
        >
          {header}
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

function Table() {
  const [data, setData] = useState(tableData);

  const sortedOnNumber = (data: any, column: string) =>
    data.sort((a: any, b: any) => b[column] - a[column]);

  const sortedOnString = (data: any, column: string) =>
    data.sort((a: any, b: any) => (a[column] > b[column] ? 1 : -1));

  const sortOnDate = (data: any) =>
    data.sort((a: any, b: any) => {
      const dateA: any = new Date(a.created_at);
      const dateB: any = new Date(b.created_at);

      return dateA - dateB;
    });

  // console.log(sortedOnString);

  function checkType(toCheck: number | string | Date) {
    if (typeof toCheck === "number") {
      return "number";
    }

    if (typeof toCheck === "string") {
      return "string";
    }

    if (typeof toCheck.getMonth === "function") {
      return "date";
    }
  }

  function sortData(
    toSort: any,
    type: string | number | Date,
    data: object,
    direction = "desc"
  ) {
    const options = {
      direction: direction,
      // type: type,
    };

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
    const firstObject: any = data[0];
    const type: any = checkType(firstObject[header]);
    const sortedData = sortData(header, type, data);
    setData([...sortedData]);
  }

  return (
    <div id={style.tableWrapper}>
      <table id={style.table}>
        <tbody>
          <TableHeader handleClick={sortDataFromColumn} tableData={data} />
          <TableRows tableData={data} />
        </tbody>
      </table>
    </div>
  );
}

export default Table;
