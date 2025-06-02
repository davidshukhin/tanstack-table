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
import type { CSSProperties } from "react";

import type { ColumnResizeMode, SortingState } from "@tanstack/react-table";
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
            Name
            {{
              asc: " 🔼",
              desc: " 🔽",
            }[column.getIsSorted() as string] ?? null}
            <button onClick={() => togglePin(column.id)}>📌</button>
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
                <button onClick={() => togglePin(column.id)}>📌</button>
              </div>
            ),
            cell: (info) => info.renderValue(),
          }
        )
      ),
    ],
    []
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns.map((c) => c.id!)
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
    },
    onColumnOrderChange: setColumnOrder,
    // columnResizeMode,
    //ColumnResizeDirection,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableExpanding: true,
    enablePinning: true,
    enableSorting: true,
    enableColumnResizing: true,
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
          background: header.column.getIsPinned() ? "#f0f0f0" : undefined,
        }}
      >
        {!header.isPlaceholder && (
          <>
            <div>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </div>
            <button {...attributes} {...listeners}>
              🟰
            </button>
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

  const DragAlongCell = ({ cell, row }: { cell: Cell<Category, unknown>, row: Row<Category> }) => {
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
    useSensor(KeyboardSensor, {})
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

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="p-4">
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
                    row={row}
                    items={columnOrder}
                    strategy={horizontalListSortingStrategy}
                  >
                    <DragAlongCell key={cell.id} cell={cell} />
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
            2
          )}
        </pre>
      </div>
    </DndContext>
  );
};

export default Table;
