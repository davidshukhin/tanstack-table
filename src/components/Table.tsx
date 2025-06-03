import { useState, useReducer, useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { read, writeFileXLSX } from "xlsx";
import * as XLSX from "xlsx";
import type { CSSProperties } from "react";

import type {
  ColumnResizeMode,
  SortingState,
  ExpandedState,
} from "@tanstack/react-table";
import type { KPIs, Category } from "../../types/data.types.ts";
//import exportToExcel from "../utils/exportToExcel.ts";
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
  const [expanded, setExpanded] = useState<ExpandedState>({});
  //const [columnResizeMode, setColumnResizeMode] =
  //useState<ColumnResizeMode>("onChange");
  //
  const [sorting, setSorting] = useState<SortingState>([]);

  type ColumnPinningState = {
    left?: string[];
    right?: string[];
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <div
            className={column.getCanSort() ? "cursor-pointer select-none" : ""}
            onClick={column.getToggleSortingHandler()}
            title={
              column.getCanSort()
                ? column.getNextSortingOrder() === "asc"
                  ? "Sort ascending"
                  : column.getNextSortingOrder() === "desc"
                    ? "Sort descending"
                    : "Clear sort"
                : undefined
            }
          >
            {{
              asc: " 🔼",
              desc: " 🔽",
            }[column.getIsSorted() as string] ?? null}
            <div className="button-container">
              Name
              <button
                className="pin-button"
                onClick={() => togglePin(column.id)}
              >
                📌
              </button>
            </div>
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
              <div
                className={
                  column.getCanSort() ? "cursor-pointer select-none" : ""
                }
                onClick={column.getToggleSortingHandler()}
                title={
                  column.getCanSort()
                    ? column.getNextSortingOrder() === "asc"
                      ? "Sort ascending"
                      : column.getNextSortingOrder() === "desc"
                        ? "Sort descending"
                        : "Clear sort"
                    : undefined
                }
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}{" "}
                {{
                  asc: " 🔼",
                  desc: " 🔽",
                }[column.getIsSorted() as string] ?? null}
                <button
                  className="pin-button"
                  onClick={() => togglePin(column.id)}
                >
                  📌
                </button>
              </div>
            ),
            cell: (info) => info.renderValue(),
          },
        ),
      ),
    ],
    [],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns.map((c) => c.id!),
  );

  const table = useReactTable<Category>({
    data,
    columns,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 600,
    },

    state: {
      columnPinning,
      sorting: sorting,
      columnOrder,
      expanded,
    },
    initialState: {
      pagination: {
        pageSize: 100,
      },
    },
    onColumnOrderChange: setColumnOrder,
    // columnResizeMode,
    //ColumnResizeDirection,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableExpanding: true,
    enablePinning: true,
    enableSorting: true,
    enableColumnResizing: true,
    debugTable: true,
    columnResizeMode: "onChange",
    getSubRows: (row) => row.children ?? [],
  });

  const DraggableTableHeader = ({ header }) => {
    const { attributes, isDragging, listeners, setNodeRef, transform } =
      useSortable({ id: header.column.id });

    return (
      <th
        colSpan={header.colSpan}
        ref={setNodeRef}
        key={header.id}
        style={{
          width: header.getSize(),
          opacity: isDragging ? 0.8 : 1,

          transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
          transition: "width transform 0.2s ease-in-out",
          whiteSpace: "nowrap",
          //minWidth: `${header.column.columnDef.minSize ?? 50}px`,
          //maxWidth: `${header.column.columnDef.maxSize ?? 400}px`,
          position: header.column.getIsPinned() ? "sticky" : "relative",
          left:
            header.column.getIsPinned() === "left"
              ? `${header.column.getStart("left")}px`
              : undefined,
          zIndex: header.column.getIsPinned() || isDragging ? 1 : 0,
          background: header.column.getIsPinned()
            ? "rgb(206,206,206)"
            : undefined,
        }}
      >
        {!header.isPlaceholder && (
          <>
            <button className="dragable-button" {...attributes} {...listeners}>
              🟰
            </button>
            <div>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </div>

            {header.column.getCanResize?.() && (
              <div
                onMouseDown={header.getResizeHandler()}
                onTouchStart={header.getResizeHandler()}
                className={`resizer ${
                  header.column.getIsResizing() ? "isResizing" : ""
                } `}
                onDoubleClick={() => header.column.resetSize()}
                style={{
                  transform:
                    table.options.columnResizeMode === "onChange" &&
                    header.column.getIsResizing()
                      ? `translateX(${
                          table.getState().columnSizingInfo.deltaOffset ?? 0
                        }px)`
                      : "",
                  position: "absolute",
                  right: 0,
                  top: 0,
                  height: "100%",
                  width: "5px",
                  cursor: "col-resize",
                  userSelect: "none",
                  touchAction: "none",
                  zIndex: 10,
                  background: header.column.getIsResizing()
                    ? "blue"
                    : "transparent",
                }}
              />
            )}
          </>
        )}
      </th>
    );
  };

  const DragAlongCell = ({
    cell,
    row,
  }: {
    cell: Cell<Category, unknown>;
    row: Row<Category>;
  }) => {
    const { isDragging, setNodeRef, transform } = useSortable({
      id: cell.column.id,
    });

    return (
      <td
        ref={setNodeRef}
        key={cell.id}
        onClick={() =>
          setSelectedCell({
            rowId: row.id,
            columnId: cell.column.id,
          })
        }
        className={
          selectedCell &&
          selectedCell.rowId === row.id &&
          selectedCell.columnId === cell.column.id
            ? "selected-cell"
            : ""
        }
        style={{
          opacity: isDragging ? 0.8 : 1,
          transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
          transition: "width transform 0.2s ease-in-out",
          width: cell.column.getSize(),
          //minWidth: `${cell.column.columnDef.minSize ?? 50}px`,
          //maxWidth: `${cell.column.columnDef.maxSize ?? 400}px`,
          position: cell.column.getIsPinned() ? "sticky" : "relative",
          left:
            cell.column.getIsPinned() === "left"
              ? `${cell.column.getStart("left")}px`
              : undefined,
          background: cell.column.getIsPinned() ? "#fff" : undefined,
          zIndex: cell.column.getIsPinned() || isDragging ? 1 : 0,
          //paddingLeft: `${row.depth * 1.5}rem`,
        }}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    );
  };

  // reorder columns after drag & drop
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);
        return arrayMove(columnOrder, oldIndex, newIndex); //this is just a splice util
      });
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

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

  function flattenRows(rows) {
    return rows.flatMap((row) => {
      const { kpis, ...rest } = row.original;
      const flat = { ...rest, ...kpis };
      delete flat.children;
      return [flat, ...(row.subRows ? flattenRows(row.subRows) : [])];
    });
  }
  function handleExportToExcel() {
    const rows = table.getRowModel().rows;
    const dataForExport = flattenRows(rows);
    console.log(rows);
    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "export.xlsx");
    console.log(dataForExport);
    //    exportToExcel(data, );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="p-4">
        <div>
          <button onClick={handleExportToExcel} title="Export to Excel">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9.75v6.75m0 0-3-3m3 3 3-3m-8.25 6a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
            <span> Export</span>
          </button>
        </div>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {headerGroup.headers.map((header) => (
                    <DraggableTableHeader key={header.id} header={header} />
                  ))}
                </SortableContext>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <SortableContext
                    key={cell.id}
                    items={columnOrder}
                    strategy={horizontalListSortingStrategy}
                  >
                    <DragAlongCell key={cell.id} cell={cell} row={row} />
                  </SortableContext>
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
        <pre
          style={{
            textAlign: "left",
            fontSize: "12px",
            background: "#f0f0f0",
            padding: "10px",
            marginTop: "20px",
          }}
        >
          {JSON.stringify(
            {
              columnSizing: table.getState().columnSizing,
              columnSizingInfo: table.getState().columnSizingInfo,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </DndContext>
  );
};

export default Table;
