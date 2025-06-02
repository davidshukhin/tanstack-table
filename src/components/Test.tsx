// AnimalTable.tsx
import React, { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel, // <-- Essential for sorting!

} from "@tanstack/react-table";
import type {ColumnResizeMode,SortingState,}from "@tanstack/react-table";
export type Animal = {
  name: string;
  species: string;
  habitat: string;
  age: number;
  status: string;
  progress: number;
  subRows?: Animal[];
};
// Your animal data
const data: Animal[] = [
  {
    name: "Leo",
    species: "Lion",
    habitat: "Savannah",
    age: 8,
    status: "Endangered",
    progress: 75,
    subRows: [
      {
        name: "Cub 1",
        species: "Lion",
        habitat: "Savannah",
        age: 1,
        status: "Stable",
        progress: 30,
      },
    ],
  },
  {
    name: "Tuki",
    species: "Elephant",
    habitat: "Rainforest",
    age: 25,
    status: "Vulnerable",
    progress: 60,
  },
  {
    name: "Nori",
    species: "Penguin",
    habitat: "Antarctica",
    age: 4,
    status: "Least Concern",
    progress: 40,
  },
  {
    name: "Zoe",
    species: "Zebra",
    habitat: "Savannah",
    age: 12,
    status: "Stable",
    progress: 90,
  },
];

const columnHelper = createColumnHelper<Animal>();

const AnimalTable: React.FC = () => {
  // State for sorting (managed externally)
  const [sorting, setSorting] = useState<SortingState>([]);
  // State for column resize mode
  const [columnResizeMode, setColumnResizeMode] =
    useState<ColumnResizeMode>("onChange");

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <div
            className={column.getCanSort() ? "cursor-pointer select-none" : ""}
            onClick={column.getToggleSortingHandler()} // Sorting handler on the header content
            title={
              column.getCanSort()
                ? column.getNextSortingOrder() === "asc"
                  ? "Sort ascending"
                  : column.getNextSortingOrder() === "desc"
                    ? "Sort descending"
                    : "Clear sort"
                : undefined
            }
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            Name
            {{
              asc: " 🔼",
              desc: " 🔽",
            }[column.getIsSorted() as string] ?? null}
          </div>
        ),
        cell: (info) => info.getValue(),
        enableSorting: true, // This column is sortable
      }),
      columnHelper.accessor("species", {
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
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            Species
            {{
              asc: " 🔼",
              desc: " 🔽",
            }[column.getIsSorted() as string] ?? null}
          </div>
        ),
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor("age", {
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
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            Age
            {{
              asc: " 🔼",
              desc: " 🔽",
            }[column.getIsSorted() as string] ?? null}
          </div>
        ),
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
    ],
    [], // Columns array does not change unless you add dynamic columns
  );

  const table = useReactTable<Animal>({
    data,
    columns,
    // === Core Table Features ===
    getCoreRowModel: getCoreRowModel(),

    // === Sorting Features ===
    enableSorting: true, // Enable sorting for the whole table
    getSortedRowModel: getSortedRowModel(), // Required for sorting rows
    state: {
      sorting: sorting, // Pass your external sorting state
    },
    onSortingChange: setSorting, // Handler to update your external sorting state

    // === Resizing Features ===
    enableColumnResizing: true, // Enable column resizing for the whole table
    columnResizeMode: columnResizeMode, // Use "onChange" for live resizing
    defaultColumn: {
      size: 150, // Default column size
      minSize: 50, // Min size allowed for resizing
      maxSize: 500, // Max size allowed for resizing
    },
    // No need for columnSizing state here, TanStack Table manages it internally by default

    // === Expanding Features (Optional for this minimal example, but included for completeness) ===
    // enableExpanding: true,
    // getExpandedRowModel: getExpandedRowModel(),
    // getSubRows: (row) => row.subRows,
  });

  return (
    <div className="p-4">
      <h2>Minimal Animal Table (Sorting & Resizing)</h2>
      <p>Click headers to sort. Drag right edge of headers to resize.</p>
      <div className="flex gap-2 mb-4">
        <label>
          Resize Mode:
          <select
            value={columnResizeMode}
            onChange={(e) =>
              setColumnResizeMode(e.target.value as ColumnResizeMode)
            }
            className="border p-1 rounded ml-2"
          >
            <option value="onEnd">onEnd</option>
            <option value="onChange">onChange</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      width: header.getSize(), // Apply TanStack's size
                      minWidth: header.column.columnDef.minSize,
                      maxWidth: header.column.columnDef.maxSize,
                      position: "relative", // Essential for resizer handle
                      textAlign: "left", // Adjust as needed
                      padding: "8px",
                      background: "#f0f0f0",
                      border: "1px solid #ccc",
                      borderBottom: "2px solid #aaa",
                      // Recommended: give space for the resizer handle visually
                      paddingRight: header.column.getCanResize()
                        ? "10px"
                        : "8px",
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}

                    {/* Resizer Handle */}
                    {!header.isPlaceholder && header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => header.column.resetSize()} // Double-click to reset size
                        className={`resizer ${
                          // No columnResizeDirection state here, defaults to ltr
                          header.column.getIsResizing() ? "isResizing" : ""
                        }`}
                        style={{
                          transform:
                            columnResizeMode === "onEnd" &&
                            header.column.getIsResizing()
                              ? `translateX(${
                                  // Simplified transform (assumes LTR direction, no need for table.options.columnResizeDirection if not passed)
                                  table.getState().columnSizingInfo
                                    .deltaOffset ?? 0
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
                            : "transparent", // Visual feedback
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
                    style={{
                      width: cell.column.getSize(), // Apply TanStack's size
                      minWidth: cell.column.columnDef.minSize,
                      maxWidth: cell.column.columnDef.maxSize,
                      padding: "8px",
                      border: "1px solid #eee",
                      textAlign: "left", // Adjust as needed
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Debugging output */}
      <pre className="mt-4 p-4 bg-gray-100 text-xs">
        <code>
          {JSON.stringify(
            {
              sorting: table.getState().sorting,
              columnSizing: table.getState().columnSizing,
              columnSizingInfo: table.getState().columnSizingInfo,
            },
            null,
            2,
          )}
        </code>
      </pre>
    </div>
  );
};

export default AnimalTable;
