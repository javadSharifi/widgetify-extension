import { FiCalendar, FiSunrise, FiWatch } from "react-icons/fi";
import { TabType } from "../../calendar/calendar";

export const tabsTools = [
  { id: "events" as TabType, icon: FiCalendar, label: "مناسبت‌ها" },
  { id: "religious-time" as TabType, icon: FiSunrise, label: "اوقات شرعی" },
  { id: "pomodoro" as TabType, icon: FiWatch, label: "پومودورو" },
];
