import { useSearchParams } from "react-router-dom";
import TodoList from "../components/TodoList";
import styles from "./TasksPage.module.css";

export default function TasksPage() {
  const [searchParams] = useSearchParams();
  const shouldOpenForm = searchParams.get("new") === "1";

  return (
    <div className={styles.page}>
      <TodoList initialShowForm={shouldOpenForm} />
    </div>
  );
}
