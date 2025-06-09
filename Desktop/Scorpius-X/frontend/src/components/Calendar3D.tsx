import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: "scan" | "backup" | "report" | "analysis" | "monitor";
  priority: "low" | "normal" | "high" | "critical";
  status: "scheduled" | "running" | "completed" | "failed";
}

interface Calendar3DProps {
  className?: string;
}

export const Calendar3D = ({ className = "" }: Calendar3DProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Sample events data
  const events: Record<string, CalendarEvent[]> = {
    "2024-01-15": [
      {
        id: "1",
        title: "Daily Contract Scan",
        time: "02:00",
        type: "scan",
        priority: "high",
        status: "completed",
      },
      {
        id: "2",
        title: "MEV Monitor Check",
        time: "14:30",
        type: "monitor",
        priority: "critical",
        status: "running",
      },
      {
        id: "3",
        title: "Database Backup",
        time: "01:00",
        type: "backup",
        priority: "high",
        status: "scheduled",
      },
    ],
    "2024-01-16": [
      {
        id: "4",
        title: "Weekly Report",
        time: "09:00",
        type: "report",
        priority: "normal",
        status: "scheduled",
      },
      {
        id: "5",
        title: "Threat Analysis",
        time: "15:00",
        type: "analysis",
        priority: "normal",
        status: "scheduled",
      },
    ],
    "2024-01-17": [
      {
        id: "6",
        title: "System Health Check",
        time: "08:00",
        type: "scan",
        priority: "normal",
        status: "scheduled",
      },
    ],
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear()
    );
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "scan":
        return "bg-primary/80";
      case "backup":
        return "bg-success/80";
      case "report":
        return "bg-warning/80";
      case "analysis":
        return "bg-info/80";
      case "monitor":
        return "bg-error/80";
      default:
        return "bg-gray-500/80";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3 h-3 text-success" />;
      case "running":
        return <Clock className="w-3 h-3 text-warning animate-spin" />;
      case "failed":
        return <AlertTriangle className="w-3 h-3 text-error" />;
      default:
        return <Calendar className="w-3 h-3 text-gray-400" />;
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = [];

  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const selectedDateKey = formatDateKey(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
  );

  const selectedEvents = events[selectedDateKey] || [];

  return (
    <div className={`${className}`}>
      <div
        className="bg-bg border-2 border-primary/40 rounded-3xl p-6"
        style={{
          boxShadow:
            "0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.05)",
          background:
            "linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.9) 100%)",
        }}
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Calendar
              className="w-6 h-6 text-primary"
              style={{ filter: "drop-shadow(0 0 6px rgba(0, 255, 255, 0.8))" }}
            />
            <h2 className="text-2xl font-header tracking-wide text-white">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="border-2 border-primary/40 bg-surface rounded-xl hover:border-primary hover:shadow-cyan-glow transition-all duration-300"
              style={{ boxShadow: "0 0 10px rgba(0, 255, 255, 0.2)" }}
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="border-2 border-primary/40 bg-surface rounded-xl hover:border-primary hover:shadow-cyan-glow transition-all duration-300 text-white px-4"
              style={{ boxShadow: "0 0 10px rgba(0, 255, 255, 0.2)" }}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="border-2 border-primary/40 bg-surface rounded-xl hover:border-primary hover:shadow-cyan-glow transition-all duration-300"
              style={{ boxShadow: "0 0 10px rgba(0, 255, 255, 0.2)" }}
            >
              <ChevronRight className="w-4 h-4 text-primary" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekdays.map((day) => (
                <div
                  key={day}
                  className="text-center py-2 text-sm font-semibold text-primary font-body tracking-wide"
                  style={{
                    filter: "drop-shadow(0 0 4px rgba(0, 255, 255, 0.6))",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={index} className="aspect-square" />;
                }

                const dateKey = formatDateKey(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  day,
                );
                const dayEvents = events[dateKey] || [];
                const hasEvents = dayEvents.length > 0;

                return (
                  <div
                    key={day}
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth(),
                          day,
                        ),
                      )
                    }
                    className={`
                      aspect-square border-2 rounded-2xl cursor-pointer transition-all duration-300 p-2 flex flex-col
                      ${
                        isToday(day)
                          ? "border-warning bg-warning/20 shadow-warning"
                          : isSelected(day)
                            ? "border-primary bg-primary/20 shadow-cyan-glow"
                            : hasEvents
                              ? "border-primary/60 bg-surface hover:border-primary hover:shadow-cyan-glow"
                              : "border-primary/20 bg-surface/50 hover:border-primary/40"
                      }
                    `}
                    style={{
                      boxShadow: isToday(day)
                        ? "0 0 15px rgba(245, 158, 11, 0.4)"
                        : isSelected(day)
                          ? "0 0 20px rgba(0, 255, 255, 0.5)"
                          : hasEvents
                            ? "0 0 10px rgba(0, 255, 255, 0.2)"
                            : "0 0 5px rgba(0, 255, 255, 0.1)",
                      transform: isSelected(day)
                        ? "translateY(-2px) scale(1.05)"
                        : "none",
                    }}
                  >
                    <div
                      className={`text-sm font-semibold font-body mb-1 ${
                        isToday(day)
                          ? "text-warning"
                          : isSelected(day) || hasEvents
                            ? "text-white"
                            : "text-gray-400"
                      }`}
                    >
                      {day}
                    </div>

                    {/* Event indicators */}
                    <div className="flex flex-wrap gap-1 flex-1">
                      {dayEvents.slice(0, 3).map((event, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`}
                          style={{
                            boxShadow: "0 0 4px rgba(0, 255, 255, 0.6)",
                          }}
                          title={`${event.time} - ${event.title}`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400"
                          title={`+${dayEvents.length - 3} more events`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Events */}
          <div
            className="bg-surface border-2 border-primary/30 rounded-2xl p-4"
            style={{
              boxShadow:
                "0 0 15px rgba(0, 255, 255, 0.1), inset 0 0 15px rgba(0, 255, 255, 0.05)",
            }}
          >
            <h3 className="text-lg font-semibold text-white font-header tracking-wide mb-4">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </h3>

            {selectedEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-bg border border-primary/20 rounded-xl p-3 hover:border-primary/40 transition-all duration-300"
                    style={{
                      boxShadow: "0 0 8px rgba(0, 255, 255, 0.1)",
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(event.status)}
                        <span className="text-sm font-semibold text-white font-body">
                          {event.title}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-mono ${
                          event.priority === "critical"
                            ? "bg-error/20 text-error"
                            : event.priority === "high"
                              ? "bg-warning/20 text-warning"
                              : "bg-primary/20 text-primary"
                        }`}
                      >
                        {event.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 font-body">
                        {event.time}
                      </span>
                      <span
                        className={`capitalize ${
                          event.status === "completed"
                            ? "text-success"
                            : event.status === "running"
                              ? "text-warning"
                              : event.status === "failed"
                                ? "text-error"
                                : "text-gray-400"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-body">No scheduled events</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
