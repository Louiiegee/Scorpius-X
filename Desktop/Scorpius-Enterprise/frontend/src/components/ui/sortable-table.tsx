import React, { useState } from "react";
import {
  motion,
  AnimatePresence,
  Reorder,
  useDragControls,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { GripVertical, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onReorder?: (newData: T[]) => void;
  onSort?: (key: keyof T, direction: "asc" | "desc") => void;
  className?: string;
  rowClassName?: string;
  enableDrag?: boolean;
  minRows?: number;
  emptyState?: React.ReactNode;
  stickyHeader?: boolean;
}

type SortDirection = "asc" | "desc" | null;

export function SortableTable<T extends { id: string | number }>({
  data,
  columns,
  onReorder,
  onSort,
  className,
  rowClassName,
  enableDrag = true,
  minRows = 5,
  emptyState,
  stickyHeader = false,
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [hoveredRow, setHoveredRow] = useState<string | number | null>(null);

  const handleSort = (key: keyof T) => {
    if (!columns.find((col) => col.key === key)?.sortable) return;

    let newDirection: SortDirection = "asc";
    if (sortKey === key) {
      newDirection =
        sortDirection === "asc"
          ? "desc"
          : sortDirection === "desc"
            ? null
            : "asc";
    }

    setSortKey(newDirection ? key : null);
    setSortDirection(newDirection);
    onSort?.(key, newDirection || "asc");
  };

  const handleReorder = (newOrder: T[]) => {
    onReorder?.(newOrder);
  };

  const SortIcon = ({ column }: { column: Column<T> }) => {
    if (!column.sortable) return null;

    const isActive = sortKey === column.key;
    const direction = isActive ? sortDirection : null;

    return (
      <motion.div
        className="ml-2 flex-shrink-0"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {direction === "asc" ? (
          <ArrowUp size={14} className="text-green-400" />
        ) : direction === "desc" ? (
          <ArrowDown size={14} className="text-green-400" />
        ) : (
          <ArrowUpDown
            size={14}
            className="text-gray-500 group-hover:text-gray-300"
          />
        )}
      </motion.div>
    );
  };

  const DragHandle = ({ item }: { item: T }) => {
    const dragControls = useDragControls();

    if (!enableDrag) return null;

    return (
      <motion.div
        className="flex items-center justify-center w-8 h-8 cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <GripVertical size={16} className="text-gray-500 hover:text-gray-300" />
      </motion.div>
    );
  };

  const TableRow = ({ item, index }: { item: T; index: number }) => {
    const y = useMotionValue(0);
    const boxShadow = useTransform(
      y,
      [-50, 0, 50],
      [
        "0 -5px 15px rgba(0, 255, 136, 0.15)",
        "0 0px 0px rgba(0, 255, 136, 0)",
        "0 5px 15px rgba(0, 255, 136, 0.15)",
      ],
    );

    const dragControls = useDragControls();

    return (
      <Reorder.Item
        value={item}
        dragListener={false}
        dragControls={dragControls}
        style={{ y, boxShadow }}
        className={cn(
          "grid gap-4 p-4 border-b border-gray-800 transition-colors duration-200",
          "hover:bg-gray-900/50 group",
          hoveredRow === item.id && "bg-gray-900/50",
          rowClassName,
        )}
        style={{
          gridTemplateColumns: `${enableDrag ? "auto " : ""}${columns.map((col) => col.width || "1fr").join(" ")}`,
        }}
        onMouseEnter={() => setHoveredRow(item.id)}
        onMouseLeave={() => setHoveredRow(null)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          delay: index * 0.05,
        }}
        whileDrag={{
          scale: 1.02,
          rotate: 1,
          zIndex: 10,
        }}
        dragElastic={0.1}
        dragConstraints={{ top: 0, bottom: 0 }}
      >
        <DragHandle item={item} />

        {columns.map((column) => (
          <div
            key={String(column.key)}
            className="flex items-center min-h-[40px]"
          >
            {column.render
              ? column.render(item, index)
              : String(item[column.key] || "-")}
          </div>
        ))}
      </Reorder.Item>
    );
  };

  if (data.length === 0) {
    return (
      <div className={cn("border border-gray-800 rounded-lg", className)}>
        {/* Header */}
        <div
          className={cn(
            "grid gap-4 p-4 bg-gray-900/50 border-b border-gray-800 font-medium text-gray-300",
            stickyHeader && "sticky top-0 z-20 backdrop-blur-sm",
          )}
          style={{
            gridTemplateColumns: `${enableDrag ? "auto " : ""}${columns.map((col) => col.width || "1fr").join(" ")}`,
          }}
        >
          {enableDrag && <div className="w-8" />}
          {columns.map((column) => (
            <button
              key={String(column.key)}
              className={cn(
                "flex items-center justify-start text-left group",
                column.sortable && "hover:text-white cursor-pointer",
              )}
              onClick={() => handleSort(column.key)}
              disabled={!column.sortable}
            >
              <span>{column.title}</span>
              <SortIcon column={column} />
            </button>
          ))}
        </div>

        {/* Empty State */}
        <div className="p-12 text-center">
          {emptyState || (
            <div className="text-gray-500">
              <div className="text-lg font-medium mb-2">No data available</div>
              <div className="text-sm">Add some items to get started</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border border-gray-800 rounded-lg overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "grid gap-4 p-4 bg-gray-900/50 border-b border-gray-800 font-medium text-gray-300",
          stickyHeader && "sticky top-0 z-20 backdrop-blur-sm",
        )}
        style={{
          gridTemplateColumns: `${enableDrag ? "auto " : ""}${columns.map((col) => col.width || "1fr").join(" ")}`,
        }}
      >
        {enableDrag && (
          <div className="w-8 flex items-center justify-center">
            <GripVertical size={16} className="text-gray-600" />
          </div>
        )}
        {columns.map((column) => (
          <button
            key={String(column.key)}
            className={cn(
              "flex items-center justify-start text-left group transition-colors",
              column.sortable && "hover:text-white cursor-pointer",
            )}
            onClick={() => handleSort(column.key)}
            disabled={!column.sortable}
          >
            <span>{column.title}</span>
            <SortIcon column={column} />
          </button>
        ))}
      </div>

      {/* Table Body */}
      <div className="min-h-0">
        {enableDrag && data.length >= minRows ? (
          <Reorder.Group
            axis="y"
            values={data}
            onReorder={handleReorder}
            className="divide-y divide-gray-800"
          >
            <AnimatePresence mode="popLayout">
              {data.map((item, index) => (
                <TableRow key={item.id} item={item} index={index} />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        ) : (
          <div className="divide-y divide-gray-800">
            <AnimatePresence mode="popLayout">
              {data.map((item, index) => (
                <motion.div
                  key={item.id}
                  className={cn(
                    "grid gap-4 p-4 transition-colors duration-200",
                    "hover:bg-gray-900/50 group",
                    hoveredRow === item.id && "bg-gray-900/50",
                    rowClassName,
                  )}
                  style={{
                    gridTemplateColumns: `${enableDrag ? "auto " : ""}${columns.map((col) => col.width || "1fr").join(" ")}`,
                  }}
                  onMouseEnter={() => setHoveredRow(item.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.05,
                  }}
                  whileHover={{
                    backgroundColor: "rgba(17, 24, 39, 0.5)",
                  }}
                >
                  {enableDrag && (
                    <div className="flex items-center justify-center w-8">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="text-gray-600"
                      >
                        <GripVertical size={16} />
                      </motion.div>
                    </div>
                  )}

                  {columns.map((column) => (
                    <div
                      key={String(column.key)}
                      className="flex items-center min-h-[40px]"
                    >
                      {column.render
                        ? column.render(item, index)
                        : String(item[column.key] || "-")}
                    </div>
                  ))}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// Example usage component
export const ExampleSortableTable = () => {
  const [data, setData] = useState([
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      role: "Admin",
      status: "Active",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      role: "User",
      status: "Inactive",
    },
    {
      id: 3,
      name: "Carol Davis",
      email: "carol@example.com",
      role: "Editor",
      status: "Active",
    },
    {
      id: 4,
      name: "David Wilson",
      email: "david@example.com",
      role: "User",
      status: "Active",
    },
    {
      id: 5,
      name: "Eve Brown",
      email: "eve@example.com",
      role: "Admin",
      status: "Inactive",
    },
  ]);

  const columns: Column<(typeof data)[0]>[] = [
    {
      key: "name",
      title: "Name",
      sortable: true,
      width: "200px",
    },
    {
      key: "email",
      title: "Email",
      sortable: true,
      width: "250px",
    },
    {
      key: "role",
      title: "Role",
      sortable: true,
      width: "120px",
      render: (item) => (
        <span
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            item.role === "Admin" && "bg-red-900/30 text-red-300",
            item.role === "Editor" && "bg-blue-900/30 text-blue-300",
            item.role === "User" && "bg-gray-900/30 text-gray-300",
          )}
        >
          {item.role}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      width: "120px",
      render: (item) => (
        <div className="flex items-center">
          <div
            className={cn(
              "w-2 h-2 rounded-full mr-2",
              item.status === "Active" ? "bg-green-400" : "bg-gray-500",
            )}
          />
          <span
            className={
              item.status === "Active" ? "text-green-400" : "text-gray-500"
            }
          >
            {item.status}
          </span>
        </div>
      ),
    },
  ];

  return (
    <SortableTable
      data={data}
      columns={columns}
      onReorder={setData}
      onSort={(key, direction) => {
        console.log(`Sorting by ${String(key)} in ${direction} order`);
      }}
      enableDrag={true}
      minRows={3}
      className="bg-black/20 backdrop-blur-sm"
    />
  );
};
