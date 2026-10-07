import DienstbefreiungForm from "./DienstbefreiungForm";
import { loadDienstbefreiungEmployee } from "./actions";

export default async function DienstbefreiungPage() {
  const employee = await loadDienstbefreiungEmployee();

  return (
    <main>
      <DienstbefreiungForm employee={employee} />
    </main>
  );
}
