import Select from "@/components/ui/select";

export default function CategorySelector() {
  return (
    <Select
      label="Category"
      name="category"
      defaultValue=""
      required
    >
      <option value="" disabled>
        Select category
      </option>

      <option value="food">Food</option>
      <option value="transport">Transport</option>
      <option value="shopping">Shopping</option>
      <option value="bills">Bills & Utilities</option>
      <option value="entertainment">Entertainment</option>
      <option value="health">Health</option>
      <option value="education">Education</option>
      <option value="salary">Salary</option>
      <option value="business">Business Income</option>
      <option value="other">Other</option>
    </Select>
  );
}