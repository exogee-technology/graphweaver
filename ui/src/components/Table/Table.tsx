import style from "./Table.module.css";

const tableData = [
  {
    id: 1,
    name: "Martin",
    age: 32,
    email: "martin@exogee.com",
    role: "admin",
    created_at: "2022-10-28 11:50:21",
  },

  {
    id: 2,
    name: "Maria",
    age: 42,
    email: "maria@exogee.com",
    role: "admin",
    created_at: "2022-10-28 11:50:21",
  },

  {
    id: 3,
    name: "Christofer",
    age: 24,
    email: "christofer@exogee.com",
    role: "user",
    created_at: "2022-10-28 11:50:21",
  },
];

function TableHeader({ tableData }: { tableData: Array<object> }) {
  const headers = Object.keys(tableData[0]);

  const singleObject: any = tableData[0];

  // When the value is a number right align text
  function valueIsNumber(header: string) {
    return typeof singleObject[header] === "number" ? style.right : "";
  }

  return (
    <tr id={style.header}>
      {headers.map((header: string) => (
        <th className={valueIsNumber(header)} key={header}>
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
  return (
    <div id={style.tableWrapper}>
      <table id={style.table}>
        <tbody>
          <TableHeader tableData={tableData} />
          <TableRows tableData={tableData} />
        </tbody>
      </table>
    </div>
  );
}

export default Table;
