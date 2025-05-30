import { useState, useReducer } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getExpandedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import type { ColumnResizeMode } from "@tanstack/react-table";
import type { KPIs, Category } from "../../types/data.types.ts";


interface TableProps { 
    data: Category[];
}
const columnHelper = createColumnHelper<Category>();

const Table = ({ data }: TableProps) => {
  const rerender = useReducer(() => ({}), {})[1];
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["name"],
    right: [],
  });
  const [selectedCell, setSelectedCell] = useState<{
    rowId: string;
    columnId: string;
  } | null>(null);
  const [columnResizeMode, setColumnResizeMode] =
    useState<ColumnResizeMode>("onChange");
  type ColumnPinningState = {
    left?: string[];
    right?: string[];
  };

  const columns = [
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <div>
          Name <button onClick={() => togglePin(column.id)}>📌</button>
        </div>
      ),
      cell: ({ row, getValue }) => (
        <>
          {row.getCanExpand() ? (
            <button
              onClick={row.getToggleExpandedHandler()}
              style={{ marginRight: "0.5rem" }}
            >
              {row.getIsExpanded() ? "▼" : "▶"}
            </button>
          ) : null}
          {getValue()}
        </>
      ),
    }),
    ...[
      "totalProducts",
      "targetValue",
      "inprocessValue",
      "confirmValue",
      "validatedValue",
      "totalValue",
      "totalVsTargetValue",
      "totalVsTargetValuePerc",
      "mixTargetValue",
      "mixActualValue",
      "targetQuantity",
      "inprocessQuantity",
      "confirmQuantity",
      "validatedQuantity",
      "totalQuantity",
      "totalVsTargetQuantity",
      "totalVsTargetQuantityPerc",
      "mixTargetQuantity",
      "mixActualQuantity",
      "nbAcsBuy",
      "acs",
    ].map((key) =>
      columnHelper.accessor(
        (row: Category) =>
          key === "totalProducts"
            ? row.totalProducts
            : row.kpis[key as keyof KPIs],
        {
          id: key,
          header: ({ column }) => (
            <div>
              {key.charAt(0).toUpperCase() + key.slice(1)}{" "}
              <button onClick={() => togglePin(column.id)}>📌</button>
            </div>
          ),
          cell: (info) => info.renderValue(),
        }
      )
    ),
  ];

  const table = useReactTable<Category>({
    data,
    columns,
    defaultColumn: {
      size: 200, // or whatever you want as the default
      minSize: 50,
      maxSize: 600,
    },

    state: {
      columnPinning,
    },
    // columnResizeMode,
    //ColumnResizeDirection,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableExpanding: true,
    enablePinning: true,
    enableColumnResizing: true,
    columnResizeMode: columnResizeMode,
    getSubRows: (row) => row.children ?? [],
  });

  function togglePin(columnId: string) {
    setColumnPinning((old) => {
      const isPinned = old.left?.includes(columnId);
      return {
        ...old,
        left: isPinned
          ? old.left?.filter((id) => id !== columnId)
          : [...(old.left ?? []), columnId],
      };
    });
  }

  return (
    <div className="p-4">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    width: `${header.getSize()}px`,
                    minWidth: `${header.column.columnDef.minSize ?? 50}px`,
                    maxWidth: `${header.column.columnDef.maxSize ?? 400}px`,
                    position: header.column.getIsPinned()
                      ? "sticky"
                      : "relative",
                    left:
                      header.column.getIsPinned() === "left"
                        ? `${header.column.getStart("left")}px`
                        : undefined,
                    zIndex: header.column.getIsPinned() ? 1 : 0,
                    background: header.column.getIsPinned()
                      ? "#f0f0f0"
                      : undefined,
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  {!header.isPlaceholder && header.column.getCanResize?.() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        height: "100%",
                        width: "5px",
                        cursor: "col-resize",
                        userSelect: "none",
                        touchAction: "none",
                        zIndex: 10,
                      }}
                    />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  onClick={() =>
                    setSelectedCell({ rowId: row.id, columnId: cell.column.id })
                  }
                  className={
                    selectedCell &&
                    selectedCell.rowId === row.id &&
                    selectedCell.columnId === cell.column.id
                      ? "selected-cell"
                      : ""
                  }
                  style={{
                    width: `${cell.column.getSize()}px`,
                    minWidth: `${cell.column.columnDef.minSize ?? 50}px`,
                    maxWidth: `${cell.column.columnDef.maxSize ?? 400}px`,
                    position: cell.column.getIsPinned() ? "sticky" : "relative",
                    left:
                      cell.column.getIsPinned() === "left"
                        ? `${cell.column.getStart("left")}px`
                        : undefined,
                    background: cell.column.getIsPinned() ? "#fff" : undefined,
                    zIndex: cell.column.getIsPinned() ? 1 : 0,
                    paddingLeft: `${row.depth * 1.5}rem`,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => rerender()} style={{ padding: "6px 12px" }}>
          Rerender
        </button>
      </div>
    </div>
  );
};

export default Table;
